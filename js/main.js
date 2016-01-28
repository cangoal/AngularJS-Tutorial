var app = angular.module('myApp', []);

var apiKey = 'MDIxMDIzMDE1MDE0NDYwNTkyODU5ZDhmOA000',
  nprUrl = 'http://api.npr.org/query?id=61&fields=relatedLink,title,byline,text,audio,image,pullQuote,all&output=JSON';

app.factory('audio', ['$document', function($document){
  var audio = $document[0].createElement('audio');
  return audio;
}]);

app.factory('player', ['$rootScope', 'audio', function($rootScope, audio){
  var player = {

    playing: false,
    progress: 0,
    current: null,
    ready: false,

    play: function(program){
      if(player.playing) 
        player.stop();

      var url = program.audio[0].format.mp4.$text;
      player.current = program;
      audio.src = url;
      audio.play();
      player.playing = true;
    },

    stop: function(){
      if(player.playing){
        audio.pause();
        player.palying = false;
        player.current = null;
      }
    },

    currentTime: function(){
      return audio.currentTime;
    },

    currentDuration: function(){
      return audio.duration;
    }
  };

  audio.addEventListener('canplay', function(evt){
    $rootScope.$apply(function(){
      player.ready = true;
    });
  });

  audio.addEventListener('timeupdate', function(evt){
    $rootScope.$apply(function(){
      player.progress = player.currentTime();
      player.progress_precent = player.progress / player.currentDuration();
    });
  });

  audio.addEventListener('ended', function() {
    $rootScope.$apply(player.stop());
  });

  return player;
}]);

app.factory('nprService', ['$http', function($http) {
    var doRequest = function(apiKey) {
      return $http({
        method: 'JSONP',
        url: nprUrl + '&apiKey=' + apiKey + '&callback=JSON_CALLBACK'
      });
    }

    return {
      programs: function(apiKey) { return doRequest(apiKey); }
    };
  }]);

app.directive('nprLink', function(){
  return{
    restrict: 'EA',
    require: ['^ngModel'],
    replace: true,
    scope:{
      ngModel: '=',
      player: '='
    },

    templateUrl: '/views/nprListItem.html',

    link: function(scope, ele, attr){
      scope.duration = scope.ngModel.audio[0].duration.$text;
    }
  }
});

app.directive('playerView', [function(){
  return {
    restrict: 'EA',
    require: ['^ngModel'],
    scope:{
      ngModel: '='
    },
    
    templateUrl: 'views/playerView.html',

    link: function(scope, iElm, iAttrs, controller){
      scope.$watch('ngModel.current', function(newVal){
        if(newVal){
          scope.playing = true;
          scope.title = scope.ngModel.current.title.$text;
          scope.$watch('ngModel.ready', function(newVal){
            if(newVal){
              scope.duration = scope.ngModel.currentDuration();
            }
          });

          scope.$watch('ngModel.progress', function(newVal){
            scope.secondsProgress = scope.ngModel.progress;
            scope.percentComplete = scope.ngModel.progress_percent;
          });
        }
      });
      scope.stop = function(){
        scope.ngModel.stop();
        scope.playing = false;
      }
    }
  };
}]);

app.controller('PlayerController', ['$scope', 'nprService', 'player', 
  function($scope, nprService, player){
  $scope.player = player;
  nprService.programs(apiKey).success(function(data, status){
    $scope.programs = data.list.story;
  });
}]);

app.controller('RelatedController', ['$scope', 'player', 
  function($scope, player){

    $scope.player = player;

    $scope.$watch('player.current', function(newVal){
      if(newVal){
        $scope.related = [];
        angular.forEach(newVal.relatedLink, function(link){
          $scope.related.push({
            link: link.link[0].$text,
            caption: link.caption.$text
          });
        });
      }
    });
}]);