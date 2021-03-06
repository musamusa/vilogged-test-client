'use strict';

/**
 * @ngdoc function
 * @name viLoggedClientApp.controller:VisitorsCtrl
 * @description
 * # VisitorsCtrl
 * Controller of the viLoggedClientApp
 */
angular.module('viLoggedClientApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('visitors', {
        parent: 'root.index',
        url: '/visitors',
        templateUrl: 'views/visitors/index.html',
        controller: 'VisitorsCtrl',
        data: {
          label: 'Visitors',
          requiredPermission: 'is_active'
        },
        ncyBreadcrumb: {
          label: 'Visitors'
        },
        resolve: {
          allVisitors: function(visitorService, notificationService) {
            return visitorService.all()
              .catch(notificationService.log);
          },
          hasAppointments: function(visitorService, notificationService) {
            return visitorService.hasAppointments()
              .catch(notificationService.log);
          }
        }
      })
      .state('visitor-form', {
        parent: 'root.index',
        url: '/visitors/add:_id',
        templateUrl: 'views/visitors/widget-form.html',
        controller: 'VisitorFormCtrl',
        resolve: {
          countryState: function (countryStateService) {
            return countryStateService.all();
          }
        },
        data: {
          label: 'Create Visitor',
          requiredPermission: 'is_active'
        },
        ncyBreadcrumb: {
          label: 'Create Visitor Profile',
          parent: 'visitors'
        }
      })
      .state('visitor', {
        parent: 'root.index',
        url: '/visitors/:_id',
        templateUrl: 'views/visitors/detail.html',
        controller: 'VisitorDetailCtrl',
        data: {
          label: 'Details',
          requiredPermission: 'is_active'
        },
        ncyBreadcrumb: {
          label: 'Visitor\'s Detail',
          parent: 'visitors'
        }
      });
  })
  .controller('VisitorsCtrl', function (
    $scope,
    visitorService,
    $rootScope,
    guestGroupConstant,
    alertService,
    $filter,
    allVisitors,
    hasAppointments
  ) {
    $scope.visitors = allVisitors;
    $scope.search = {};
    $scope.pagination = {
      currentPage: 1,
      maxSize: 5,
      itemsPerPage: 10
    };

    var rows = $filter('orderBy')(allVisitors, 'created', 'reverse');
    $scope.pagination.totalItems = rows.length;
    $scope.pagination.numPages = Math.ceil($scope.pagination.totalItems / $scope.pagination.itemsPerPage);
    updateTableData();

    $scope.csvHeader = [
      'Passcode',
      'Name',
      'Gender',
      'Email',
      'Phone',
      'contact Address',
      'Company Name',
      'Company Address',
      'Group Type',
      'Created Date',
      'Modified Date'
    ];

    $scope.createdDate = {
      opened: false,
      date: moment().endOf('day').toDate(),
      open: function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        this.opened = !this.opened;
      }
    };

    $scope.$watch('search', function () {
      updateTableData();
    }, true);

    $scope.orderByColumn = {
      created: {
        reverse: true
      }

    };

    function dateFormat() {
      return {
        opened: false,
        open: function ($event) {
          $event.preventDefault();
          $event.stopPropagation();
          this.opened = !this.opened;
        }
      };
    }

    $scope.dateRange = {
      from: dateFormat(),
      to: dateFormat()
    };

    $scope.sort = function(column) {
      if ($scope.orderByColumn[column]) {
        $scope.orderByColumn[column].reverse = !$scope.orderByColumn[column].reverse;
      } else {
        $scope.orderByColumn = {};
        $scope.orderByColumn[column]= {reverse: true};
      }
      $scope.visitors = $filter('orderBy')($scope.visitors, column, $scope.orderByColumn[column].reverse);
    };

    function updateTableData() {
      var exports = [];
      var createdBy = null;
      if (!$scope.user.is_staff && !$scope.user.is_superuser) {
        createdBy = $scope.user.id;
      }

      (function() {
        $scope.visitors = [];
        var length = rows.length;
        for (var i = 0; i < length; i++) {
          var row = rows[i];
          var date = moment(row.created);
          var include = true;

          if (include && $scope.search.name) {
            include = row.first_name.toLowerCase().indexOf($scope.search.name.toLowerCase()) > -1 ||
            row.last_name.toLowerCase().indexOf($scope.search.name.toLowerCase()) > -1;
          }

          if (include && $scope.search.visitors_email) {
            include = row.visitors_email.toLowerCase().indexOf($scope.search.visitors_email.toLowerCase()) > -1;
          }

          if (include && $scope.search.visitors_phone) {
            include = row.visitors_phone.toLowerCase().indexOf($scope.search.visitors_phone.toLowerCase()) > -1;
          }

          if (include && $scope.search.company_name) {
            include = row.company_name.toLowerCase().indexOf($scope.search.company_name.toLowerCase()) > -1;
          }

          if (include && $scope.search.group_type && row.group_type) {
            include = guestGroupConstant[row.group_type].toLowerCase().indexOf($scope.search.company_name.toLowerCase()) > -1;
          }

          if (include && $scope.search.created) {
            include = include && (date.isSame($scope.search.created, 'day'));
          }

          if (hasAppointments.length || createdBy !== null) {
            include = include && (hasAppointments.indexOf(row.uuid) !== -1 || row.created_by === createdBy);
          }


          if (include && $scope.search.from) {
            include = include && $filter('date')(row.created, 'yyyy-MM-dd') >= $filter('date')($scope.search.from, 'yyyy-MM-dd');
          }

          if (include && $scope.search.to) {
            include = include && $filter('date')(row.created, 'yyyy-MM-dd') <= $filter('date')($scope.search.to, 'yyyy-MM-dd');
          }

          if (include) {
            $scope.visitors.push(row);
            exports.push({
              pass_code: row.visitors_pass_code,
              name: row.first_name + ' ' + row.last_name,
              gender: row.gender,
              email: row.visitors_email,
              phone: row.visitors_phone,
              contact_address: row.visitors_address,
              company_name: row.company_name,
              company_address: row.company_address,
              group_type: row.group_type != null && angular.isDefined(row.group_type) ? row.group_type.group_name : 'None',
              created_date: $filter('date')(row.created, 'longDate'),
              created_by: row.created_by,
              modified_date:  $filter('date')(row.modified, 'longDate'),
              modified_by: row.modified_by
            });
          }
        }
      })();

      $scope.export = exports;
    }

    $scope.getGroupType = function (index) {
      return guestGroupConstant[index];
    }
  })
  .controller('VisitorFormCtrl', function (
    $scope,
    $state,
    $stateParams,
    $rootScope,
    $window,
    $filter,
    visitorService,
    validationService,
    countryStateService,
    guestGroupConstant,
    userService,
    countryState,
    visitorGroupsService,
    visitorsLocationService,
    notificationService,
    utility,
    alertService
  ) {
    $scope.visitors = [];
    $scope.visitor = {};
    $scope.visitorsLocation = {};
    $scope.countryState = {};
    $scope.countries = [];
    $scope.states = [];
    $scope.lgas = [];
    $scope.countryState = countryState;
    $scope.countries = Object.keys(countryState);
    $scope.validationErrors = {};
    $scope.activateImageUploader = false;
    $scope.activateCamera = false;
    $scope.imageCapture = false;
    $scope.locked = false;
    $scope.phoneNumberPrefixes = ["0701", "0703", "0705", "0706", "0708", "0802", "0803", "0804", "0805", "0806", "0807",
      "0808", "0809", "0810", "0811", "0812", "0813", "0814", "0815", "0816", "0817", "0818", "0819", "0909", "0902",
      "0903", "0905", "Others"];
    $scope.phoneNumber = {};

    $rootScope.busy = true;
    visitorGroupsService.all()
      .then(function(response) {
        $scope.visitorGroups = response;
        $rootScope.busy = false;
      })
      .catch(function(reason) {
        $rootScope.busy = false;
      });

    $scope.dob = {
      opened: false,
      open: function ($event) {
        $event.preventDefault();
        $event.stopPropagation();

        this.opened = true;
      }
    };

    $scope.activateImageCapturing = function () {
      $scope.imageCapture = true;
      $scope.activateCamera = true;
      $scope.btnText = 'Activate Image Uploader';
    };

    $scope.activateImageCapture = function () {
      if ($scope.activateCamera) {
        $scope.activateImageUploader = true;
        $scope.activateCamera = false;
        $scope.btnText = 'Activate Camera';
      } else {
        $scope.activateImageUploader = false;
        $scope.activateCamera = true;
        $scope.btnText = 'Activate Image Uploader';
      }
    };

    $scope.validateBirthDate = function (dateString) {
      var checkAge = [];
      var today = new Date();
      var birthDate = new Date(dateString);
      var age = today.getFullYear() - birthDate.getFullYear();
      var m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 14) {
        var minYear = today.getFullYear() - 14;
        checkAge.push('Birth year can\'t be less than year ' + minYear);
      }

      if (age <= 0) {
        checkAge.push('Date of birth can\'t be in the future or present');
      }

      if (checkAge.length) {
        $scope.validationErrors['date_of_birth'] = checkAge;
      } else {
        delete $scope.validationErrors['date_of_birth'];
      }
    };

    $scope.lockPointer = function ($event) {
      $event.preventDefault();
      $event.stopPropagation();
      $scope.locked = !$scope.locked;
    };

    $scope.setFiles = function (element, field) {
      $scope.$apply(function () {

        var fileToUpload = element.files[0];
        if (fileToUpload.type.match('image*')) {
          var reader = new $window.FileReader();
          reader.onload = function (theFile) {
            $scope.visitor[field] = theFile.target.result;
          };
          reader.readAsDataURL(fileToUpload);
        }

      });
    };

    $scope.visitor = {};
    $scope.visitor_location = {};
    $scope.vehicle = {};
    $scope.document = {};
    $scope.default = {};
    $scope.title = 'Create Visitor Profile';
    $scope.vehicleTypes = [
      {name: 'Car'},
      {name: 'Bus'},
      {name: 'Motor Cycle'},
      {name: 'Tri-Cycle'},
      {name: 'Lorry'}
    ];

    if ($stateParams.visitor_id !== null && $stateParams.visitor_id !== undefined) {
      $rootScope.busy = true;
      visitorService.get($stateParams.visitor_id)
        .then(function (response) {
          $scope.visitor = response;

          if ($scope.visitor.visitors_phone) {
            var prefix = $scope.visitor.visitors_phone.substr(0,4);
            var suffix = $scope.visitor.visitors_phone.substr(4);

            $scope.phoneNumber.prefix = $scope.phoneNumberPrefixes.indexOf(prefix) > 0 ? prefix : "Others";

            $scope.phoneNumber.suffix = prefix === "Others" ? $scope.visitor.visitors_phone : suffix;
          }

          if ($scope.visitor.nationality) {
            $scope.states = Object.keys($scope.countryState[$scope.visitor.nationality].states).sort();
          }

          if ($scope.visitor.state_of_origin && $scope.countryState[$scope.visitor.nationality]) {
            if ($scope.countryState[$scope.visitor.nationality].states[$scope.visitor.state_of_origin]) {
              $scope.lgas = $scope.countryState[$scope.visitor.nationality].states[$scope.visitor.state_of_origin].lga.sort();
            }
          }
          visitorsLocationService.findByField('visitor_id', response.uuid)
            .then(function (response) {
              if (response.length) {
                $scope.visitorsLocation = response[0];

                if ($scope.countryState[$scope.visitorsLocation.residential_country]) {
                  $scope.locationStates = Object.keys($scope.countryState[$scope.visitorsLocation.residential_country].states).sort();
                  if ($scope.countryState[$scope.visitorsLocation.residential_country].states[$scope.visitorsLocation.residential_state]) {
                    $scope.locationLgas = $scope.countryState[$scope.visitorsLocation.residential_country].states[$scope.visitorsLocation.residential_state].lga.sort();
                  }
                }
              }
              $rootScope.busy = false;
            })
            .catch(function (reason) {
              $rootScope.busy = false;

            });
          $scope.title = 'Edit ' + $scope.visitor.firstName + '\'s Profile';
        })
        .catch(function (reason) {
          notificationService.setTimeOutNotification(reason);
          $rootScope.busy = false;
        });
    }

    $scope.saveProfile = function () {
      /**
       * sends email and sms to new visitor account
       */
      function sendNotification() {
        var visitor = {
          first_name: $scope.visitor.first_name,
          last_name: $scope.visitor.last_name,
          phone: $scope.visitor.visitors_phone,
          pass_code: $scope.visitor.visitors_pass_code
        };

        var emailTemplate = visitorService.EMAIL_TEMPLATE;
        var compiledEmailTemplate = utility.compileTemplate(visitor, emailTemplate);


        var smsTemplate = visitorService.SMS_TEMPLATE;
        var compiledSMSTemplate = utility.compileTemplate(visitor, smsTemplate, '&&');


        if (angular.isDefined($scope.visitor.visitors_phone) && $scope.visitor.visitors_phone !== '' && $scope.visitor.visitors_phone !== null) {
          notificationService.send.sms({
            message: compiledSMSTemplate,
            mobiles: $scope.visitor.visitors_phone
          });
        }

        if (angular.isDefined($scope.visitor.visitors_email) && $scope.visitor.visitors_email !== '' && $scope.visitor.visitors_email !== null) {
          notificationService.send.email({
            to: $scope.visitor.visitors_email,
            subject: 'Visitor\'s profile created.',
            message: compiledEmailTemplate
          });
        }
      }

      $rootScope.busy = true;
      var emailValidation = validationService.EMAIL();

      var nameValidation = validationService.BASIC();
      nameValidation.pattern = '/^[a-zA-Z]/';

      var phonePrefix = validationService.BASIC();
      var phoneSuffix = validationService.BASIC();

      phonePrefix.pattern = '/^[0-9]/';
      phoneSuffix.checkLength = true;

      if ($scope.phoneNumber.prefix === 'Others') {
        phoneSuffix.minLength = 6;
        phoneSuffix.maxLength = 15;
      } else {
        phoneSuffix.maxLength = 7;
        phoneSuffix.minLength = 7;
      }

      var phoneValidationParams = {
        prefix: phonePrefix,
        suffix: phoneSuffix
      };

      var validationParams = {
        first_name: nameValidation,
        last_name: nameValidation,
        gender: validationService.BASIC(),
        visitors_email: emailValidation,
        group_type: validationService.BASIC()
      };

      var validationParams2 = {
        contact_address: validationService.BASIC()
      };

      var validateLocation = validationService.validateFields(validationParams2, $scope.visitorsLocation);
      var validatePhoneNumbers = validationService.validateFields(phoneValidationParams, $scope.phoneNumber);

      if (!angular.isDefined($scope.visitor.visitors_pass_code)) {
        $scope.visitor.visitors_pass_code = new Date().getTime();
      }

      $scope.validationErrors = validationService.validateFields(validationParams, $scope.visitor);
      (Object.keys(validateLocation)).forEach(function (key) {
        $scope.validationErrors[key] = validateLocation[key];
      });

      (Object.keys(validatePhoneNumbers)).forEach(function (key) {
        $scope.validationErrors[key] = validatePhoneNumbers[key];
      });

      if (!Object.keys($scope.validationErrors).length) {
        if (!angular.isDefined($scope.visitor.company_name)) {
          $scope.visitor.company_name = 'Anonymous';
        }

        $scope.visitor.visitors_phone = $scope.phoneNumber.prefix === 'Others' ?
          $scope.phoneNumber.suffix : $scope.phoneNumber.prefix + $scope.phoneNumber.suffix;

        if ($scope.takenImg) {
          $scope.visitor.image = $scope.takenImg;
        }

        if ($scope.visitor.date_of_birth) {
          $scope.visitor.date_of_birth = $filter('date')($scope.visitor.date_of_birth, 'yyyy-MM-dd');
        }

        if (!angular.isDefined($scope.visitorsLocation.residential_country)) {
          $scope.visitorsLocation.residential_country = 'Other';
          $scope.visitorsLocation.residential_state = 'Not set';
          $scope.visitorsLocation.residential_lga = 'Not Set';
        }

        visitorService.save($scope.visitor)
          .then(function (response) {
            $scope.visitor = response;

            function afterRegistration() {

              if ($scope.user.is_staff) {
                alertService.success('Visitor profile was saved successfully.');
                $state.go('visitors');
              } else {
                alertService.success('Your profile was saved successfully.');
                $state.go('show-visitor', {visitor_id: $scope.visitor.uuid});
              }
              sendNotification();
            }

            $scope.visitorsLocation.visitor_id = response.uuid;
            visitorsLocationService.save($scope.visitorsLocation)
              .then(function () {
                $rootScope.busy = false;
                alertService.success('Visitor profile was saved successfully.');
                $state.go('visitors');
              })
              .catch(function (reason) {
                Object.keys(reason).forEach(function (key) {
                  $scope.validationErrors[key] = reason[key];
                  $rootScope.busy = false;
                });
                notificationService.setTimeOutNotification(reason);
                //afterRegistration();
              });
          })
          .catch(function (reason) {
            Object.keys(reason).forEach(function (key) {
              $scope.validationErrors[key] = reason[key];
              $rootScope.busy = false;
            });
            notificationService.setTimeOutNotification(reason);
            $rootScope.busy = false;
          });
      } else {
        $rootScope.busy = false;
      }

    };

    $scope.getStates = function (country) {
      $scope.visitor.state_of_origin = '';
      $scope.states = Object.keys($scope.countryState[country].states).sort();
    };

    $scope.getLGAs = function (state, country) {
      $scope.visitor.lga_of_origin = '';
      if ($scope.countryState[country].states[state]) {
        $scope.lgas = $scope.countryState[country].states[state].lga.sort();
      }
    };

    $scope.getResidentialStates = function (country) {
      $scope.visitorsLocation.residential_state = '';
      $scope.locationStates = Object.keys($scope.countryState[country].states).sort();
    };

    $scope.getResidentialLGAS = function (state, country) {
      $scope.visitorsLocation.residential_lga = '';
      if ($scope.countryState[country].states[state]) {
        $scope.locationLgas = $scope.countryState[country].states[state].lga.sort();
      }
    };
  })
  .controller('VisitorDetailCtrl', function (
    $scope,
    $stateParams,
    visitorService,
    appointmentService,
    visitorsLocationService,
    $rootScope,
    notificationService
  ) {
    $scope.visitor = {};
    $scope.visitorsLocation = {};
    $scope.appointments = [];
    $scope.upcomingAppointments = [];
    $scope.pagination = {
      appointmentsCurrentPage: 1,
      appointmentsPerPage: 10,
      maxSize: 5
    };
    $rootScope.busy = true;
    $scope.visitorLoaded = false;
    $scope.appointmentLoaded = false;

    visitorService.get($stateParams.visitor_id)
      .then(function (response) {
        $scope.visitor = response;
        if (response.uuid) {
          visitorsLocationService.findByField('visitor_id', response.uuid)
            .then(function (response) {
              if (response.length) {
                $scope.visitorsLocation = response[0];
              }
              $scope.visitorLoaded = true;
              if ($scope.appointmentLoaded) {
                $rootScope.busy = false;
              }
            })
            .catch(function (reason) {
              $scope.visitorLoaded = true;
              if ($scope.appointmentLoaded) {
                $rootScope.busy = false;
              }
              notificationService.setTimeOutNotification(reason);
            });
        }

      })
      .catch(function (reason) {
        notificationService.setTimeOutNotification(reason);

      });

    appointmentService.getNestedAppointmentsByVisitor($stateParams._id)
      .then(function(response) {
        $rootScope.busy = false;

        $scope.upcomingAppointments = response
          .filter(function (appointment) {
            return appointment.is_approved &&
              new Date(appointment.appointment_date).getTime() > new Date().getTime() && !appointment.is_expired;
          });

        $scope.appointments = response;
        $scope.pagination.totalAppointments = $scope.appointments.length;
        $scope.pagination.appointmentNumPages =
          Math.ceil($scope.pagination.totalAppointments / $scope.pagination.appointmentsPerPage);

      })
      .catch(function(reason) {
        $rootScope.busy = false;
        notificationService.setTimeOutNotification(reason);
      });

  })
;
