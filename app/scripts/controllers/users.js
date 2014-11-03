'use strict';

/**
 * @ngdoc function
 * @name viloggedClientApp.controller:UsersCtrl
 * @description
 * # UsersCtrl
 * Controller of the viloggedClientApp
 */
angular.module('viLoggedClientApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('profile', {
        parent: 'root.index',
        url: '/profile',
        templateUrl: 'views/user/user-profile.html',
        controller: 'UserProfileCtrl'
      })
  })
  .config(function($stateProvider) {
    $stateProvider
      .state('users', {
        parent: 'root.index',
        url: '/users',
        templateUrl: 'views/user/index.html',
        controller: 'UsersCtrl'
      })
  })
  .config(function($stateProvider) {
    $stateProvider
      .state('createUser', {
        parent: 'root.index',
        url: '/user/add',
        templateUrl: 'views/user/widget-form.html',
        controller: 'UserFormCtrl'
      })
  })
  .config(function($stateProvider) {
    $stateProvider
      .state('editUser', {
        parent: 'root.index',
        url: '/user/:user_id/edit',
        templateUrl: 'views/user/widget-form.html',
        controller: 'UserFormCtrl'
      })
  })
  .config(function($stateProvider) {
    $stateProvider
      .state('change-password', {
        parent: 'root.index',
        url: '/users/change-password',
        templateUrl: 'views/user/user-change-password.html',
        controller: 'ChangePasswordCtrl'
      })
  })
  .controller('UserProfileCtrl', function($scope, $interval, userService, appointmentService) {
    $scope.currentUser = userService.user;

    appointmentService.getAppointmentsByUser($scope.currentUser)
      .then(function(response) {
        $scope.numberOfAppointments = response.length;
      })
      .catch(function (reason) {
        console.log(reason);
      });

    appointmentService.getUpcomingAppointments($scope.currentUser)
      .then(function(response) {
        $scope.upcomingAppointments = response;
        $scope.upcomingAppointmentCount = response.length;
        console.log($scope.upcomingAppointmentCount)
      })
      .catch(function(reason) {
        console.log(reason);
      });

    appointmentService.getAppointmentsAwaitingApproval($scope.currentUser)
      .then(function(response) {
        $scope.appointmentsAwaitingApproval = response;
        $scope.appointmentsAwaitingApprovalCount = response.length;
      })
      .catch(function(reason) {
        console.log(reason);
      });
  })
  .controller('UsersCtrl', function ($scope, userService) {
    userService.all()
      .then(function(response) {
        $scope.users = response;
      })
      .catch(function(reason) {
        console.log(reason);
      });

    $scope.toggleActive = function (id) {
      userService.toggleUserActivationStatus(id)
        .then(function(response){
          console.log(response);
        });
    };

    $scope.deleteAccount = function (id) {
      userService.remove(id)
    }
  })
  .controller('UserFormCtrl', function ($scope, $state, $stateParams, userService, companyDepartmentsService) {
    $scope.currentUser = userService.user;
    $scope.user = {};

    if ($stateParams.user_id) {
      userService.get($stateParams.user_id)
        .then(function (response) {
          $scope.user = response;
        })
        .catch(function (reason) {
        })
    }

    companyDepartmentsService.all()
      .then(function (response) {
        $scope.departments = response;
      })
      .catch(function (reason) {
        console.log(reason);
      });

    if (!$scope.currentUser.is_superuser) {
      $state.go("home");
    }

    $scope.createUserAccount = function () {
      if ($scope.user.user_profile !== undefined || $scope.user.user_profile === null) {
        $scope.user.user_profile.home_phone = $scope.user.user_profile.home_phone || null;
        $scope.user.user_profile.work_phone = $scope.user.user_profile.work_phone || null;
      }

      userService.save($scope.user)
        .then(function() {
          $state.go("users");
        })
        .catch(function(reason) {
          console.log(reason);
        });
    }
  })
  .controller('ChangePasswordCtrl', function($scope, $sate, $stateParams, userService) {
    $scope.userPassword = {};

    $scope.changeAccountPassword = function() {
      userService.updatePassword($scope.userPassword)
        .then(function(response) {
          $state.go("home");
        })
        .catch(function(reason) {})
    }
  });