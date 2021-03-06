'use strict';

//TODO:: Work on model validations

angular.module('viLoggedClientApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('appointments', {
        parent: 'root.index',
        url: '/appointments',
        templateUrl: 'views/appointments/index.html',
        controller: 'AppointmentCtrl',
        data: {
          requiredPermission: 'is_active',
          label: 'Appointments'
        },
        ncyBreadcrumb: {
          label: 'Appointments'
        }
      })
      .state('show-appointment', {
        parent: 'root.index',
        url: '/appointments/:appointment_id',
        templateUrl: 'views/appointments/detail.html',
        controller: 'AppointmentDetailCtrl',
        data: {
          label: 'Appointment Detail'
        },
        ncyBreadcrumb: {
          label: 'Appointment Detail',
          parent: 'appointments'
        }
      })
      .state('create-appointment-visitor', {
        parent: 'root.index',
        url: '/appointments/add/:visitor_id',
        templateUrl: 'views/appointments/form.html',
        controller: 'AppointmentFormCtrl',
        data: {
          label: 'Create Appointment'
        },
        ncyBreadcrumb: {
          label: 'Create Appointment',
          parent: 'appointments'
        }
      })
      .state('create-appointment-host', {
        parent: 'root.index',
        url: '/appointments/add/:host_id',
        templateUrl: 'views/appointments/form.html',
        controller: 'AppointmentFormCtrl',
        data: {
          requiredPermission: 'is_active',
          label: 'Create Appointment'
        },
        ncyBreadcrumb: {
          label: 'Create Appointment',
          parent: 'appointments'
        }
      })
      .state('create-appointment', {
        parent: 'root.index',
        url: '/appointments/add/',
        templateUrl: 'views/appointments/form.html',
        controller: 'AppointmentFormCtrl',
        data: {
          requiredPermission: 'is_staff',
          label: 'Create Appointment'
        },
        ncyBreadcrumb: {
          label: 'Create Appointment',
          parent: 'appointments'
        }
      })
      .state('edit-appointment', {
        parent: 'root.index',
        url: '/appointments/:appointment_id/edit/',
        templateUrl: 'views/appointments/form.html',
        controller: 'AppointmentFormCtrl',
        data: {
          requiredPermission: 'is_active',
          label: 'Edit Appointment'
        },
        ncyBreadcrumb: {
          label: 'Edit Appointment',
          parent: 'appointments'
        }
      })
      .state('visitor-check-in', {
        parent: 'root.index',
        url: '/appointments/:appointment_id/check-in',
        templateUrl: 'views/appointments/check-in.html',
        controller: 'CheckInCtrl',
        data: {
          requiredPermission: 'is_staff',
          label: 'Check Visitor In'
        },
        ncyBreadcrumb: {
          label: 'Check Visitor In',
          parent: 'appointments'
        }
      })
      .state('print-visitor-label', {
        url: '/appointments/:appointment_id/print-pass',
        templateUrl: 'views/appointments/visitor-pass.html',
        controller: 'VisitorPassCtrl',
        data: {
          requiredPermission: 'is_staff',
          label: 'Print Visitor Tag'
        },
        ncyBreadcrumb: {
          label: 'Print Visitor Tag',
          parent: 'appointments'
        }
      })
      .state('visitor-check-out', {
        parent: 'root.index',
        url: '/appointments/:appointment_id/check-out',
        templateUrl: 'views/appointments/check-out.html',
        controller: 'CheckOutCtrl',
        data: {
          requiredPermission: 'is_staff',
          label: 'Check Visitor Out'
        },
        ncyBreadcrumb: {
          label: 'Check Visitor Out',
          parent: 'appointments'
        }
      })
  })
  .controller('AppointmentCtrl', function($scope, $filter, appointmentService, utility, $rootScope, notificationService, alertService) {

    $rootScope.busy = true;

    $scope.appointments = [];
    $scope.pagination = {
      currentPage: 1,
      maxSize: 5,
      itemsPerPage: 10
    };


    $scope.search = {};
    var rows = [];

    $scope.orderByColumn = {
      appointment_date: {
        reverse: true
      }

    };

    $scope.sort = function(column) {
      if ($scope.orderByColumn[column]) {
        $scope.orderByColumn[column].reverse = !$scope.orderByColumn[column].reverse;
      } else {
        $scope.orderByColumn = {};
        $scope.orderByColumn[column]= {reverse: true};
      }
      $scope.appointments = $filter('orderBy')($scope.appointments, column, $scope.orderByColumn[column].reverse);
    };

    $scope.createdDate = {
      opened: false,
      date: moment().endOf('day').toDate(),
      open: function($event) {
        $event.preventDefault();
        $event.stopPropagation();
        this.opened = true;
      }
    };

    $scope.csvHeader = [
      'Vistor',
      'Gender',
      'Representing',
      'Purpose of Visit',
      'Host',
      'Gender',
      'Department',
      'Appointment Date',
      'Start Time',
      'End Time',
      'Date Checked in',
      'Date Checked out'
    ];

    $scope.isAppointmentUpcoming = function(appointmentDate, visitStartTime) {
      return appointmentService.isAppointmentUpcoming(appointmentDate, visitStartTime);
    };

    $scope.isAppointmentExpired = function(appointmentDate, visitEndTime) {
      return appointmentService.isAppointmentExpired(appointmentDate, visitEndTime)
    };

    $scope.deleteAppointment = function(id) {
      var dialogParams = {
        modalHeader: 'Delete Appointment',
        modalBodyText: 'Are you sure you want to delete the following?'
      };

      notificationService.modal.confirm(dialogParams)
        .then(function() {
          $rootScope.busy = true;
          appointmentService.remove(id)
            .then(function(response) {
              $rootScope.busy = false;
              getAppointments();
            })
            .catch(function(reason) {
              $rootScope.busy = false;
              notificationService.setTimeOutNotification(reason);
            });
        });
    };

    function dateFormat() {
      return {
        opened: false,
        open: function ($event) {
          $event.preventDefault();
          $event.stopPropagation();

          this.opened = true;
        }
      };
    }

    $scope.dateRange = {
      from: dateFormat(),
      to: dateFormat()
    };

    function getAppointments() {
      appointmentService.all()
        .then(function(response) {
          rows = $filter('orderBy')(response, 'created', 'reverse');
          $scope.pagination.totalItems = rows.length;
          $scope.pagination.numPages = Math.ceil($scope.pagination.totalItems / $scope.pagination.itemsPerPage);
          updateTableData();
          $rootScope.busy = false;
        })
        .catch(function(reason) {
          notificationService.setTimeOutNotification(reason);
          $rootScope.busy = false;
        });
    }

    function getUserAppointments() {
      appointmentService.getNestedAppointmentsByUser($rootScope.user)
        .then(function(response) {
          rows = $filter('orderBy')(response, 'created', 'reverse');
          $scope.pagination.totalItems = rows.length;
          $scope.pagination.numPages = Math.ceil($scope.pagination.totalItems / $scope.pagination.itemsPerPage);
          $rootScope.busy = false;
          updateTableData();
        })
        .catch(function(reason) {
          alertService.messageToTop.error(reason.message);
          $rootScope.busy = false;
        })
    }

    $scope.user.is_staff ? getAppointments() : getUserAppointments();

    $scope.$watch('search', function () {
      updateTableData();
    }, true);

    function updateTableData() {
      var exports = [];
      $scope.appointments = rows.filter(function (row) {

        var date = moment(row.appointment_date);
        var include = true;

        if (include && $scope.search.visitors_name) {
          include = include && row.visitor_id.first_name.toLowerCase().indexOf($scope.search.visitors_name.toLowerCase()) > -1 ||
          row.visitor_id.last_name.toLowerCase().indexOf($scope.search.visitors_name.toLowerCase()) > -1;
        }

        if (include && $scope.search.label_code) {
          include = include && row.label_code.toLowerCase().indexOf($scope.search.label_code.toLowerCase()) > -1;
        }

        if (include && $scope.search.host_name) {
          include = include && row.host_id.first_name.toLowerCase().indexOf($scope.search.host_name.toLowerCase()) > -1 ||
          row.host_id.last_name.toLowerCase().indexOf($scope.search.host_name.toLowerCase()) > -1;
        }

        if (include && $scope.search.start_time) {
          include = include && row.visit_start_time.toLowerCase().indexOf($scope.search.start_time.toLowerCase()) > -1;
        }

        if (include && $scope.search.end_time) {
          include = include && row.visit_end_time.toLowerCase().indexOf($scope.search.visit_end_time.toLowerCase()) > -1;
        }

        if (include && $scope.search.appointment_date) {
          include = include && (date.isSame($scope.search.appointment_date, 'day'));
        }

        if (include && $scope.search.is_approved) {

          include = include &&  String($scope.search.is_approved) === String(row.is_approved);
        }


        if (include && $scope.search.from) {
          include = include && $filter('date')(row.appointment_date, 'yyyy-MM-dd') >= $filter('date')($scope.search.from, 'yyyy-MM-dd');
        }

        if (include && $scope.search.to) {
          include = include && $filter('date')(row.appointment_date, 'yyyy-MM-dd') <= $filter('date')($scope.search.to, 'yyyy-MM-dd');
        }

        return include;
      });

      $scope.appointments.forEach(function(row) {
        var host = angular.isDefined(row.host_id) && row.host_id !== null ? row.host_id : null;
        var department = '';
        if (host !== null) {
          department = angular.isDefined(row.host_id.user_profile) && row.host_id.user_profile !== null ? row.host_id.user_profile.department : '';
        }

        exports.push({
          visitor: row.visitor_id.first_name +' '+ row.visitor_id.last_name,
          visitorsGender: row.visitor_id.gender,
          representing: row.representing,
          purpose_of_visit: row.purpose,
          host: angular.isDefined(row.host_id) && row.host_id !== null ? row.host_id.first_name + ' '+ row.host_id.last_name : '',
          hostGender: angular.isDefined(row.host_id) && row.host_id !== null ? row.host_id.gender : '',
          hostDepartment: department,
          appointmentDate: row.appointment_date,
          startTime: row.visit_start_time,
          endTime: row.visit_end_time,
          checkedIn: row.checked_in,
          checkedOut: row.checked_out
        });
      });
      $scope.export = exports;
    }

    $scope.exportToOutlook = function(appointment) {
     return (appointmentService.getOutlookCalender(appointment));
    };
  })
  .controller('AppointmentDetailCtrl', function($scope, $state, $stateParams, appointmentService, utility, $modal, toastr,
                                                notificationService, $rootScope, alertService) {

    $rootScope.busy = true;
    appointmentService.getNested($stateParams.appointment_id)
      .then(function(response) {
        $scope.appointment = response;
        $rootScope.busy = false;
      })
      .catch(function(reason) {
        $rootScope.busy = false;
        notificationService.setTimeOutNotification(reason);
      });

    $scope.printLabel = function() {
      $rootScope.busy = true;
      $modal.open({
        templateUrl: 'views/appointments/partials/visitor-pass-template.html',
        controller: function($scope, $modalInstance, appointmentService) {
          $scope.$modalInstance = $modalInstance;
          appointmentService.getNested($stateParams.appointment_id)
            .then(function(response) {
              $scope.appointment = response;
              if (!$scope.appointment.label_code) {
                $scope.appointment.label_code = $scope.appointment.uuid;
              }
              $("#barcode").JsBarcode($scope.appointment.label_code,{width:1,height:25});

              $rootScope.busy = false;
            })
            .catch(function(reason) {
              $rootScope.busy = false;
              notificationService.setTimeOutNotification(reason);
            });
        }
      });
    };


    $scope.toggleAppointmentApproval = function(approvalStatus) {
      var dialogParams = {
        modalHeader: 'Appointment Approval'
      };

      dialogParams.modalBodyText = approvalStatus ? 'Are you sure you want to approve this appointment?' :
        'Are you sure you want to disapprove this appointment?';

      //sends email and sms to visitor whose appointment has been approved
      function sendMessage () {
        appointmentService.getNested($scope.appointment.uuid)
          .then(function(response) {
            var appointmentObject = response;
            var appointment = {
              first_name: appointmentObject.visitor_id.first_name,
              last_name: appointmentObject.visitor_id.last_name,
              start_time: appointmentObject.visit_start_time,
              host_first_name: appointmentObject.host_id.first_name,
              host_last_name: appointmentObject.host_id.last_name,
              date: appointmentObject.appointment_date
            };

            var emailTemplate = appointmentService.APPOINTMENT_APPROVAL_EMAIL_TEMPLATE;
            var compiledEmailTemplate = utility.compileTemplate(appointment, emailTemplate);

            var smsTemplate = appointmentService.APPOINTMENT_APPROVAL_SMS_TEMPLATE;
            var compiledSMSTemplate = utility.compileTemplate(appointment, smsTemplate);

            if (angular.isDefined(appointmentObject.visitor_id.visitors_phone) && appointmentObject.visitor_id.visitors_phone !== '') {
              notificationService.send.sms({
                message: compiledSMSTemplate,
                mobiles: appointmentObject.visitor_id.visitors_phone
              });
            }

            if (angular.isDefined(appointmentObject.visitor_id.visitors_email) && appointmentObject.visitor_id.visitors_email !== '') {
              notificationService.send.email({
                to: appointmentObject.visitor_id.visitors_email,
                subject: 'Appointment Schedule Approved.',
                message: compiledEmailTemplate
              });
            }

            $rootScope.busy = false;
          })
          .catch(function(reason) {
            notificationService.setTimeOutNotification(reason);
            $rootScope.busy = false;
          });

      }

      notificationService.modal.confirm(dialogParams)
        .then(function() {
          $rootScope.busy = true;
          appointmentService.get($stateParams.appointment_id)
            .then(function(response) {
              response.is_approved = approvalStatus ? 1 : 0;
              appointmentService.save(response)
                .then(function() {
                  approvalStatus ? alertService.messageToTop.success('The selected appointment has been approved.') :
                    alertService.messageToTop.error('The selected appointment has been rejected.');
                  $rootScope.busy = false;
                  sendMessage();
                  $state.go('appointments');
                })
                .catch(function(reason) {
                  $rootScope.busy = false;
                  notificationService.setTimeOutNotification(reason);
                });
            })
            .catch(function(reason) {
              $rootScope.busy = false;
              notificationService.setTimeOutNotification(reason);
            });
        });
    };

    $scope.isAppointmentUpcoming = function(appointmentDate, visitStartTime) {
      return appointmentService.isAppointmentUpcoming(appointmentDate, visitStartTime);
    };

    $scope.isAppointmentExpired = function(appointmentDate, visitEndTime) {
      return appointmentService.isAppointmentExpired(appointmentDate, visitEndTime);
    };
  })
  .controller('AppointmentFormCtrl', function($scope, $stateParams, $state, $timeout, $filter, visitorService, toastr,
                                              userService, appointmentService, utility, validationService, $rootScope,
                                              notificationService, alertService) {

    appointmentService.defaultEntrance()
      .then(function(response) {
        $scope.defaultEntrance = response;
      })
      .catch(function(reason) {
        notificationService.setTimeOutNotification(reason);
      });

    $rootScope.busy = false;
    $scope.appointment = {};
    $scope.visit_start_time = new Date();
    $scope.visit_end_time = new Date();
    $scope.host = {};
    $scope.visitor = {};
    $scope.customErrors = {};
    $scope.validationErrors = {};
    $scope.teamMembers = {
      members: [{name: ''}],
      checkEmpty: function() {
        var emptyFields = [];
        $scope.teamMembers.members.forEach(function(row) {
          if (row.name === '' || row.name === undefined || row.name === null) {
            emptyFields.push(row.name);
          }
        });
        return emptyFields;
      },
      add: function() {
        if ($scope.teamMembers.checkEmpty().length === 0) {
          $scope.teamMembers.members.push({
            name: ''
          });
        }
      },
      remove: function(index) {
        if ($scope.teamMembers.members.length > 1) {
          $scope.teamMembers.members.splice(index);
        }

      }
    };


    $scope.clearError = function(key) {
      delete $scope.customErrors[key];
    };

    //sends email and sms to host when appointment is created
    function sendMessage () {

      appointmentService.getNested($scope.appointment.uuid)
        .then(function(response) {
          var appointmentObject = response;
          var appointment = {
            first_name: appointmentObject.host_id.first_name,
            last_name: appointmentObject.host_id.last_name
          };

          var emailTemplate = appointmentService.APPOINTMENT_CREATED_EMAIL_TEMPLATE;
          var compiledEmailTemplate = utility.compileTemplate(appointment, emailTemplate);

          var smsTemplate = appointmentService.APPOINTMENT_CREATED_SMS_TEMPLATE;
          var compiledSMSTemplate = utility.compileTemplate(appointment, smsTemplate);

          if (angular.isDefined(appointmentObject.host_id.user_profile.phone) && appointmentObject.host_id.user_profile.phone !== '') {
            notificationService.send.sms({
              message: compiledSMSTemplate,
              mobiles: appointmentObject.host_id.user_profile.phone
            });
          }

          if (angular.isDefined(appointmentObject.host_id.email) && appointmentObject.host_id.email !== '') {
            notificationService.send.email({
              to: appointmentObject.host_id.email,
              subject: 'Appointment created.',
              message: compiledEmailTemplate
            });
          }
          $rootScope.busy = false;
        })
        .catch(function(reason) {
          $rootScope.busy = false;
          notificationService.setTimeOutNotification(reason);
        });
    }

    $scope.appointmentDate = {
      opened: false,
      minDate: new Date(),
      open: function($event) {
        $event.preventDefault();
        $event.stopPropagation();

        this.opened = true
      }
    };

    $scope.disabled = function(date, mode) {
      return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
    };

    $scope.getHost = function(hostPhone) {
      $rootScope.busy = true;
      if (!hostPhone) {
        $rootScope.busy = false;
        return;
      }
      userService.getUserByPhone(hostPhone)
        .then(function(response) {
          $rootScope.busy = false;
          $scope.host.selected = response[0];
          $scope.host.errorMessage = '';

        })
        .catch(function(reason) {
          $rootScope.busy = false;
          $scope.host.selected = '';
          $scope.host.errorMessage = 'Host not found';
          notificationService.setTimeOutNotification(reason);
        });
    };

    $scope.validateTimeDate = function(type) {
      var now = new Date().getTime();
      var checkStartTime = [];
      var checkEndTime = [];
      var checkAppointmentDate = [];
      var appointmentDate =
        angular.isUndefined($scope.appointment.appointment_date) ? $filter('date')(new Date(), 'yyyy-MM-dd') :
          $filter('date')($scope.appointment.appointment_date, 'yyyy-MM-dd');

      var start = (appointmentDate+' '+$filter('date')($scope.visit_start_time, 'HH:mm:ss')).split(/[\s|:|-]/);
      var end =  (appointmentDate+' '+$filter('date')($scope.visit_end_time, 'HH:mm:ss')).split(/[\s|:|-]/);

      var startTime = new Date(start[0], start[1]-1, start[2], start[3], start[4], start[5]);
      var endTime = new Date(end[0], end[1]-1, end[2], end[3], end[4], end[5]);

      if (startTime.getTime() > endTime.getTime()){
        checkStartTime.push('start time can\'t be greater than end time');
      }
      if (startTime.getTime() < now) {
        checkStartTime.push('start time can\'t be lesser than current time');
      }

      if (checkStartTime.length) {
        $scope.validationErrors['visit_start_time'] = checkStartTime;
      } else {
        delete $scope.validationErrors['visit_start_time'];
      }

    };

    $scope.validateVisitationTime = function () {
      var checkVisitTime = [];
      if ($scope.appointment.purpose === 'Personal') {
        var dayOfWeek = moment($scope.appointment.appointment_date).weekday();
        var nameOfDay = moment.weekdaysShort(dayOfWeek);

        console.log(nameOfDay);

        var visitStartTime = $filter('date')($scope.visit_start_time, 'HH:mm:ss').substr(0,2);
        var visitEndTime = $filter('date')($scope.visit_end_time, 'HH:mm:ss').substr(0,2);

        if (nameOfDay !== 'Tue' && nameOfDay !== 'Thu') {
          checkVisitTime.push('Personal visitors are only allowed on Tuesday and Thursday between 1pm and 3pm');
        } else if (visitStartTime < 13 || visitStartTime > 15 || visitEndTime > 15) {
          checkVisitTime.push('Personal visits are only allowed between the hours of 1pm and 3pm on Tuesday and Thursday');
        }
      }

      if (checkVisitTime.length) {
        $scope.validationErrors['purpose'] = checkVisitTime;
      } else {
        delete $scope.validationErrors['purpose'];
      }
    };

    $scope.hostLookUp = {
      refreshHostsList: function(phone) {
        $rootScope.busy = true;
        if (!phone) {
          $rootScope.busy = false;
          return;
        }
        userService.getUserByNameOrPhone(phone)
          .then(function(response) {
            $scope.hosts = response;
            $rootScope.busy = false;
          })
          .catch(function(reason) {
            $rootScope.busy = false;
            notificationService.setTimeOutNotification(reason);
          });
      },
      listHosts: function() {
        $rootScope.busy = true;
        userService.all()
          .then(function(response) {
            $rootScope.busy = false;
            $scope.hosts = response;
          })
          .catch(function(reason) {
            $rootScope.busy = false;
            notificationService.setTimeOutNotification(reason);
          })
      }
    };

    $scope.visitorLookUp = {
      refreshVisitorsList: function(visitorPhone) {
        $rootScope.busy = true;
        visitorService.findByPhone(visitorPhone)
          .then(function(response) {
            $rootScope.busy = false;
            $scope.visitors = response;
          })
          .catch(function(reason) {
            $rootScope.busy = false;
            notificationService.setTimeOutNotification(reason);
          })
      },
      listVisitors: function() {
        $rootScope.busy = true;
        visitorService.all()
          .then(function(response) {
            $rootScope.busy = false;
            $scope.visitors = response;
          })
          .catch(function(reason) {
            $rootScope.busy = false;
            notificationService.setTimeOutNotification(reason);
          })
      }
    };

    if (angular.isDefined($scope.user) && !angular.isDefined($stateParams.appointment_id)) {
      if (!$scope.user.is_staff && $scope.user.is_active) $scope.host = $scope.user;

      if ($scope.user.is_staff) $scope.hostLookUp.listHosts();

      if ($scope.user.is_active) $scope.visitorLookUp.listVisitors();
    }

    if ($stateParams.appointment_id) {
      $rootScope.busy = true;
      appointmentService.getNested($stateParams.appointment_id)
        .then(function(response){
          $rootScope.busy = false;
          $scope.appointment = response;
        })
        .catch(function(reason) {
          $rootScope.busy = false;
        });
    }

    if ($stateParams.visitor_id) {
      $rootScope.busy = true;
      visitorService.get($stateParams.visitor_id)
        .then(function(response) {
          $rootScope.busy = false;
          $scope.visitor.selected = response;
        })
        .catch(function(reason) {
          $rootScope.busy = false;
          notificationService.setTimeOutNotification(reason);
        })
    }

    if ($stateParams.host_id) {
      $rootScope.busy = true;
      userService.get($stateParams.host_id)
        .then(function(response) {
          $rootScope.busy = false;
          $scope.host.selected = response;
        })
        .catch(function(reason) {
          $rootScope.busy = false;
          notificationService.setTimeOutNotification(reason);
        })
    }

    $scope.createAppointment = function() {
      $rootScope.busy = true;
      $scope.appointment.label_code = utility.generateRandomInteger().toString().substr(-5);
      $scope.appointment.appointment_date = $filter('date')($scope.appointment.appointment_date, 'yyyy-MM-dd');
      $scope.appointment.is_expired = false;
      $scope.appointment.checked_in = null;
      $scope.appointment.checked_out = null;
      $scope.appointment.teams = '';
      if (!$scope.teamMembers.checkEmpty().length) {
        var teams = [];
        $scope.teamMembers.members.forEach(function(row) {
          teams.push(row.name);
        });

        $scope.appointment.teams = teams.join(', ');
      }

      //var representing = $scope.appointment.representing.split(',');
      //$scope.appointment.representing = JSON.stringify(representing);

      $scope.appointment.visit_start_time = $filter('date')($scope.visit_start_time, 'HH:mm:ss');
      $scope.appointment.visit_end_time = $filter('date')($scope.visit_end_time, 'HH:mm:ss');

      if ($rootScope.user.is_active && !$rootScope.user.is_staff) {
        $scope.appointment.host_id = $rootScope.user.id;
      } else {
        $scope.appointment.host_id = angular.isDefined($scope.host.selected) ? $scope.host.selected.id : undefined;
      }

      if ($scope.appointment.host_id === $rootScope.user.id) {
        $scope.appointment.is_approved = 1;
      }

      $scope.appointment.visitor_id = angular.isDefined($scope.visitor.selected) ? $scope.visitor.selected.uuid : undefined;

      var validationParams = {
        appointment_date: validationService.BASIC(),
        visit_start_time: validationService.BASIC(),
        visit_end_time: validationService.BASIC(),
        purpose: validationService.BASIC(),
        host_id: validationService.BASIC(),
        visitor_id: validationService.BASIC()
      };

      $scope.validationErrors = validationService.validateFields(validationParams, $scope.appointment);
      if (!Object.keys($scope.validationErrors).length) {
        if (!$scope.appointment.entrance_id) {
          $scope.appointment.entrance_id = $scope.defaultEntrance;
        }
        appointmentService.hasPendingAppointment($scope.appointment)
          .then(function(response) {
            if (!response) {
              appointmentService.save($scope.appointment)
                .then(function() {
                  $rootScope.busy = false;
                  sendMessage();
                  alertService.messageToTop.success( 'Appointment was successfully created' );
                  $scope.user.is_active ? $state.go('appointments') : $state.go('visitors', {visitor_id: $stateParams.visitor_id});
                })
                .catch(function(reason) {
                  $rootScope.busy = false;
                  if (angular.isObject(reason)) {
                    Object.keys(reason).forEach(function(key) {
                      $scope.validationErrors[key] = reason[key];
                    });
                  }
                  notificationService.setTimeOutNotification(reason);
                });
            } else {
              alertService.messageToTop.error('Visitor has a pending appointment with this host.');
              if (!$scope.user.is_active) {
                $rootScope.busy = false;
                //$state.go('show-visitor', {visitor_id: $scope.visitor.selected.uuid});
              } else {
                $rootScope.busy = false;
                //$state.go('appointments');
              }
            }
          })
          .catch(function(reason) {
            $rootScope.busy = false;
            console.log(reason);
            notificationService.setTimeOutNotification(reason);
          });
      } else {
        $rootScope.busy = false;
      }
    };
  })
  .controller('CheckInCtrl', function($scope, $state, $stateParams, $q, visitorService, appointmentService, entranceService,
                                      vehicleTypeConstant, notificationService, utility, restrictedItemsService,
                                      vehicleService, toastr, $rootScope, alertService) {

    $scope.appointment = {};
    $scope.restricted_items = [{
      item_code: '',
      item_name: '',
      item_type: ''
    }];
    $scope.default = {};
    $scope.vehicle = {};
    $scope.vehicleTypes = vehicleTypeConstant;
    $scope.restrictedItemsErrors = {};

    $rootScope.busy = true;
    entranceService.all()
      .then(function(response) {
        $rootScope.busy = false;
        $scope.entrances = response;
      })
      .catch(function(reason) {
        $rootScope.busy = false;
        notificationService.setTimeOutNotification(reason);
      });

    $rootScope.busy = true;
    appointmentService.getNested($stateParams.appointment_id)
      .then(function(response) {
        $rootScope.busy = false;
        $scope.appointment = response;
        if (angular.isUndefined($scope.restricted_items)) {
          $scope.restricted_items = [{
            item_code: '',
            item_name: '',
            item_type: ''
          }];
        }
      })
      .catch(function(reason) {
        $rootScope.busy = false;
        notificationService.setTimeOutNotification(reason);
      });

    $rootScope.busy = true;
    appointmentService.getNested($stateParams.appointment_id)
      .then(function(response) {
        $rootScope.busy = false;
        $scope.appointmentView = response;
        if (angular.isUndefined($scope.restricted_items)) {
          $scope.restricted_items = [{
            item_code: '',
            item_name: '',
            item_type: ''
          }];
        }
      })
      .catch(function(reason) {
        $rootScope.busy = false;
        notificationService.setTimeOutNotification(reason);
      });

    $scope.checkItemScope = function() {
      if ($scope.item === false) {
        $scope.restricted_items = [];
      }
    };

    function validateItems() {
      var errors = {};
      $scope.restricted_items.forEach(function(item, index) {

        Object.keys(item).forEach(function(key) {
          if (!item[key]) {
            errors[index + key] = 'Please enter item value to continue';
          }
        });
      });

      $scope.restrictedItemsErrors = errors;
      return Object.keys(errors).length === 0;
    }

    $scope.addItem = function() {
      if (!angular.isDefined($scope.item)) {
        $scope.item = true;
        return;
      }

      if ($scope.item === false) {
        $scope.item = true;
      }
      if (validateItems()) {
        $scope.restricted_items.push({
          item_code: '',
          item_name: '',
          item_type: ''
        });
      }

    };

    $scope.removeItem = function(index) {
      $scope.restricted_items.splice(index, 1);

      if ($scope.restricted_items.length === 0) {
        $scope.item = false;
      }
    };

    function itemNotEmpty(item) {
      var empty = [];
      Object.keys(item).forEach(function(key) {
        if (angular.isUndefined(item[key]) || item[key] === '') {
          empty.push(item);
        }
      });
      return empty.length === 0;
    }

    $scope.checkVisitorIn = function() {

      $scope.appointment.checked_in = utility.getISODateTime();
      $scope.appointment.visitor_id = $scope.appointment.visitor_id.uuid;
      $scope.appointment.host_id = $scope.appointment.host_id.id;

      var restricted = [];
      $scope.restricted_items.forEach(function(item) {
        if (itemNotEmpty(item)) {
          item.appointment_id = $scope.appointment.uuid;
          restricted.push(restrictedItemsService.save(item));
        }
      });

      $scope.vehicle.appointment_id = $scope.appointment.uuid;
      var promises = [
        appointmentService.save($scope.appointment)
      ];

      if ($scope.withVehicle) {
        promises.push(vehicleService.save($scope.vehicle));
      }

      if (restricted.length) {
        promises.push(restricted);
      }

      $rootScope.busy = true;
      $q.all(promises)
        .then(function() {
          $rootScope.busy = false;
          alertService.messageToTop.success('Visitor checked in successfully.');
          $state.go('appointments');
        })
        .catch(function(reason) {
          $rootScope.busy = false;
          notificationService.setTimeOutNotification(reason);
        });
    }
  })
  .controller('CheckOutCtrl', function ($scope, $state, $stateParams, appointmentService, utility, notificationService,
                                        toastr, $rootScope, alertService) {

    $rootScope.busy = true;
    appointmentService.get($stateParams.appointment_id)
      .then(function (response) {
        $rootScope.busy = false;
        $scope.appointment = response;
        checkOut(response);
      })
      .catch(function (reason) {
        notificationService.setTimeOutNotification(reason);
        $rootScope.busy = false;
      });

    function checkOut(response) {
      response.checked_out = utility.getISODateTime();
      appointmentService.save(response)
        .then(function (response) {
          alertService.messageToTop.success('Visitor checked out successfully.');
          $state.go('appointments');
          $rootScope.busy = false;
        })
        .catch(function(reason) {
          notificationService.setTimeOutNotification(reason);
          $rootScope.busy = false;
        });
    }
  })
  .controller('VisitorPassCtrl', function($scope, $state, $stateParams, appointmentService, $rootScope) {

    $scope.appointment = {};
    $rootScope.busy = true;
    appointmentService.getNested($stateParams.appointment_id)
      .then(function(response) {
        $rootScope.busy = false;
        $scope.appointment = response;
      })
      .catch(function(reason) {
        $rootScope.busy = false;
        notificationService.setTimeOutNotification(reason);
      })
  });
