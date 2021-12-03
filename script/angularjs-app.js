var config = function ($routeProvider) {
    $routeProvider
        .when("/contact", { templateUrl: "../page/contact.html" })
        .when("/faq", { templateUrl: "../page/faq.html" })
        .when("/contact", { templateUrl: "../page/contact.html" })
        .when("/feedback", { templateUrl: "../page/feedback.html" })
        .when("/about", { templateUrl: "../page/about.html" })
        .when("/register", { templateUrl: "../page/register.html" })
        .when("/login", { templateUrl: "../page/login.html" })
        .when("/forgot-password", { templateUrl: "../page/forgot-password.html" })
        .when("/account/info", {
            templateUrl: "../page/account-info.html",
            resolve: {
                "currentAuth": ["Auth", function (Auth) {
                    return Auth.$requireSignIn();
                }]
            }
        })
        .when("/account/change-password", { templateUrl: "../page/password-change.html" })
        .when("/test/info", {
            templateUrl: "../page/test-info.html",
            controller: "ctrlTestInfo",
            resolve: {
                "currentAuth": ["Auth", function (Auth) {
                    return Auth.$requireSignIn();
                }]
            }
        })
        .when("/test/take", {
            templateUrl: "../page/test.html",
            controller: "ctrlTest",
            resolve: {
                "currentAuth": ["Auth", function (Auth) {
                    return Auth.$requireSignIn();
                }]
            }
        })
        .when("/test/result", { 
            templateUrl: "../page/test-result.html", 
            controller: "ctrlTestResult",
            resolve: {
                "currentAuth": ["Auth", function (Auth) {
                    return Auth.$requireSignIn();
                }]
            } 
        })
        .when("/test/list", { 
            templateUrl: "../page/test-list.html",
            resolve: {
                "currentAuth": ["Auth", function (Auth) {
                    return Auth.$requireSignIn();
                }]
            } 
        })
        .otherwise({ templateUrl: "../page/home.html" })
}

firebase.initializeApp(FirebaseConfig);

//controller
var ctrl = function ($scope, $firebaseAuth, $location, $route, $firebaseObject, $firebaseArray) {
    $scope.auth = $firebaseAuth();
    $scope.subjectsList = $firebaseArray(firebase.database().ref().child('subject'));
    $scope.login = {};
    $scope.reset = {};
    $scope.register = {};
    $scope.profile = {};
    $scope.info = {};

    $scope.re = /^([a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+)$/;
    var today = new Date();
    var minAge = 18;
    var maxAge = 99;
    $scope.minAge = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
    $scope.maxAge = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());


    $scope.$on("$routeChangeError", function (event, next, previous, error) {
        if (error === "AUTH_REQUIRED") {
            $location.path("/home");
            authNotify.fire({
                icon: 'error',
                title: 'Chưa đăng nhập!'
            })
        }
    })

    // any time auth state changes, add the user data to scope
    $scope.auth.$onAuthStateChanged(function (firebaseUser) {
        $scope.firebaseUser = firebaseUser;
        if (firebaseUser) {
            $scope.userInfo = $firebaseObject(firebase.database().ref('users/' + firebase.auth().currentUser.uid));
            $scope.userInfoSync();
        } else {
            $scope.info = {};
            $scope.userInfo = {};
        }
    });

    // signin with email and password 
    $scope.normalSignin = function () {
        console.log($scope.login.remember);
        if ($scope.login.remember) {
            console.log("memorized");
            firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        } else {
            console.log("not memorized")
            firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
        }

        $scope.auth.$signInWithEmailAndPassword($scope.login.em, $scope.login.pw)
            .then(function () {
                console.log("Signed in as:", firebase.auth().currentUser.uid);
                $location.path('/home');
                authNotify.fire({
                    icon: 'success',
                    title: 'Đăng nhập thành công'
                })
            }).catch(function (error) {
                console.error("Authentication failed:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Đăng nhập không thành công',
                    text: 'Email hoặc mật khẩu không đúng!'
                })
            });
    }

    // signout
    $scope.signout = function () {
        $scope.auth.$signOut()
            .then(function () {
                console.log("Signed out");
                $location.path('/home');
                authNotify.fire({
                    icon: 'success',
                    title: 'Đăng xuất thành công'
                })
            })
    }

    // signin with google
    $scope.googleSingin = function () {
        $scope.auth.$signInWithPopup('google')
            .then(function () {
                $location.path('/home');
                authNotify.fire({
                    icon: 'success',
                    title: 'Đăng nhập thành công'
                })
            }).catch(function (error) {
                console.error("Authentication failed:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Đăng nhập không thành công',
                    text: 'Có lỗi xảy ra!'
                })
            });
    }

    // register with email and password
    $scope.register = function (invalid) {
        if (invalid) return;

        // Create a new user
        if ($scope.register.password === $scope.register.cpassword) {
            $scope.auth.$createUserWithEmailAndPassword($scope.register.email, $scope.register.password)
                .then(async () => {
                    console.log("User created with uid: " + firebase.auth().currentUser.uid);
                    if (firebase.auth().currentUser) {
                        firebase.auth().currentUser.updateProfile({
                            displayName: $scope.register.fullname,
                        });
                        await firebase.database().ref('users/' + firebase.auth().currentUser.uid)
                            .set({
                                birthday: $scope.register.birthday,
                                gender: $scope.register.gender
                            });
                    }
                }).then(function () {
                    $location.path('/home');
                }).then(function () {
                    console.log('Register success!');
                    firebase.auth().currentUser.reload();
                    authNotify.fire({
                        icon: 'success',
                        title: 'Đăng kí thành công!'
                    })
                }).catch(function (error) {
                    console.error(error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Đăng kí không thành công',
                        text: 'Email đã được đăng kí!'
                    })
                })
        }
    }

    // reset password
    $scope.resetPass = function (invalid) {
        if (invalid) return;


        $scope.auth.$sendPasswordResetEmail($scope.reset.email).then(function () {
            console.log("Password reset email sent successfully!");
            Swal.fire({
                icon: 'success',
                title: 'Email đặt lại mật khẩu đã được gửi!'
            })
        }).catch(function (error) {
            console.error("Error: ", error);
            Swal.fire({
                icon: 'error',
                title: 'Không tồn tại email trong hệ thống!'
            })
        });
    }

    // change password
    $scope.changePassword = function () {
        $scope.auth.$signInWithEmailAndPassword($scope.firebaseUser.email, $scope.changePassword.oldPassword)
            .then(function () {
                if ($scope.changePassword.newPassword === $scope.changePassword.cNewPassword) {
                    $scope.auth.$updatePassword($scope.changePassword.newPassword)
                        .then(function () {
                            console.log('Change password success!');
                            Swal.fire({
                                icon: 'success',
                                title: 'Đổi mật khẩu thành công',
                            })
                            $scope.changePassword.oldPassword = null;
                            $scope.changePassword.newPassword = null;
                            $scope.changePassword.cNewPassword = null;
                            $route.reload();
                        }).catch(function (error) {
                            console.error(error);
                            Swal.fire({
                                icon: 'error',
                                title: 'Đổi mật khẩu không thành công',
                                text: 'Mật khẩu không đúng!'
                            })
                        })
                }
            }).catch(function (error) {
                console.error("Authentication failed:", error);
            });
    }

    // change password
    $scope.updateInfo = function () {
        $scope.firebaseUser.updateProfile({
            displayName: $scope.info.fullname,
        }).then(function () {
            $scope.userInfo.birthday = $scope.info.birthday;
            $scope.userInfo.gender = $scope.info.gender;
            $scope.userInfo.school = $scope.info.school ? $scope.info.school : null;
            $scope.userInfo.$save().then(function () {
                console.log("Update success");
                Swal.fire({
                    icon: 'success',
                    title: 'Cập nhật thành công',
                })
            });
        }).catch(function (error) {
            console.error("Update failed:", error);
            Swal.fire({
                icon: 'error',
                title: 'Cập nhật không thành công',
                text: 'Có lỗi xảy ra!'
            })
        });;


    }

    // sync info user
    $scope.userInfoSync = function () {
        firebase.auth().currentUser.reload();

        $scope.userInfo.$loaded()
            .then(function () {
                $scope.info.fullname = $scope.firebaseUser.displayName;
                $scope.info.birthday = $scope.userInfo.birthday;
                $scope.info.gender = $scope.userInfo.gender;
                $scope.info.email = $scope.firebaseUser.email;
                $scope.info.school = $scope.userInfo.school;
                console.log($scope.info);
            })
    }

    $scope.page = 0;
    $scope.itemPerPage = 4;
    $scope.pageCount = 0;
    $scope.lastPage = 0;
    $scope.subjectsList.$loaded()
        .then(function () {
            $scope.pageCount = Math.ceil($scope.subjectsList.length / $scope.itemPerPage);
        }).then(function () {
            $scope.lastPage = $scope.pageCount - 1;
        });

    $scope.first = function () {
        $scope.page = 0;
        console.log($scope.page);
    }

    $scope.prev = function () {
        if ($scope.page > 0) {
            $scope.page--;
        }
        console.log($scope.page);
    }

    $scope.next = function () {
        if ($scope.page < $scope.lastPage) {
            $scope.page++;
        }
    }

    $scope.last = function () {
        $scope.page = $scope.lastPage;
    }

    $scope.jump = function (page) {
        $scope.page = page;
    }


    $scope.subjectSelect;
    $scope.subjectsList.$loaded().then(function () {
        $scope.loadList($scope.subjectsList[0]);
    })

    $scope.subjectLoad;
    $scope.loadList = function (subject) {
        $scope.subjectSelect = subject;
        $scope.auth.$waitForSignIn().then(
            function () {
                try { $scope.subjectLoad = $firebaseObject(firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/test/' + subject.Id)); }
                catch (err) { }
            }
        )
    }

    $scope.loadResult = function (index) {
        $location.path("/test/result").search({ id: Object.keys($scope.subjectLoad.testList)[index], u: firebase.auth().currentUser.uid, su: $scope.subjectSelect.Id });
    }

}

var ctrlTestInfo = function ($scope, $routeParams, $firebaseObject) {
    $scope.subjectInfo = $firebaseObject(firebase.database().ref('subjectInfo/' + $routeParams.id));
    $scope.test = $firebaseObject(firebase.database().ref('users/' + $routeParams.u + '/test/' + $routeParams.id));

    $scope.takeTest = function () {
        Swal.fire({
            title: $scope.test.active ? 'Tiếp tục bài thi?' : 'Thực hiện bài thi?',
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: $scope.test.active ? 'Tiếp tục' : 'Thực hiện',
            cancelButtonText: 'Không'
        }).then(function (result) {
            if (result.value) {
                window.location.href = "#!test/take?id=" + $routeParams.id + "&u=" + $routeParams.u;
            }
        })
    }

    $scope.$on("$routeChangeError", function (event, next, previous, error) {
        if (error === "AUTH_REQUIRED") {
            $location.path("/home");
            authNotify.fire({
                icon: 'error',
                title: 'Chưa đăng nhập!'
            })
        }
    })
}

var ctrlTest = function ($scope, $routeParams, $timeout, $location, $firebaseArray, $firebaseObject) {
    $scope.test = $firebaseObject(firebase.database().ref('users/' + $routeParams.u + '/test/' + $routeParams.id));
    $scope.testQuestions = [];
    $scope.answers = new Array(10).fill(undefined);
    $scope.length = 0;

    $scope.$on("$routeChangeError", function (event, next, previous, error) {
        if (error === "AUTH_REQUIRED") {
            $location.path("/home");
            authNotify.fire({
                icon: 'error',
                title: 'Chưa đăng nhập!'
            })
        }
    })

    $scope.loadTest = function () {
        $scope.test.$loaded()
            .then(async () => {
                if (!$scope.test.active) {
                    $scope.getQuestion();
                } else {
                    $scope.testQuestions = $firebaseArray(firebase.database().ref('test/' + $scope.test.active));
                    $scope.testQuestions.$loaded().then(function () {
                        for (let i = 0; i < $scope.testQuestions.length; i++) {
                            $scope.answers[i] = $scope.testQuestions[i].Answered;
                        }
                        console.log($scope.answers);
                        $scope.length = $scope.testQuestions.length;
                        $scope.r = $firebaseObject(firebase.database().ref('users/' + $routeParams.u + '/test/' + $routeParams.id + "/testList/" + $scope.test.active));
                        $scope.r.$loaded().then(function () {
                            console.log($scope.r);
                            if ($scope.r.s == null || $scope.r.m == null) {
                                $scope.r.s = 0;
                                $scope.r.m = 15;
                            }
                            $scope.r.$save().then(function () {
                                $scope.r.$bindTo($scope, "result").then(function () {
                                    setTimeout(timer(), 2000);
                                })
                            })
                        })

                    })
                }
            })

    }

    var timer = function () {
        $scope.result.m = ($scope.result.s == 0 ? $scope.result.m - 1 : $scope.result.m);
        $scope.result.s = ($scope.result.s == 0 ? 60 : $scope.result.s);
        $scope.result.s--;

        if ($scope.result.s == 0 && $scope.result.m == 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Hết thời gian',
                allowOutsideClick: false
            }).then($scope.closeTest());

        }
        else {
            console.log("timer");
            timerRun = $timeout(timer, 1000);
        }
    };

    $scope.getQuestion = function () {
        let libraryQuestion = $firebaseArray(firebase.database().ref('subjectInfo/' + $routeParams.id + '/Questions'));
        libraryQuestion.$loaded()
            .then(function () {
                let testQuestions = libraryQuestion.sort(() => 0.5 - Math.random()).slice(0, 10);
                let testSave = $firebaseArray(firebase.database().ref('test/'));
                testSave.$add(testQuestions).then(
                    function (ref) {
                        $scope.test.active = ref.key;
                        $scope.testQuestions = $firebaseArray(firebase.database().ref('test/' + $scope.test.active));
                        $scope.testQuestions.$loaded().then(function () {
                            $scope.length = $scope.testQuestions.length;
                            $scope.r = $firebaseObject(firebase.database().ref('users/' + $routeParams.u + '/test/' + $routeParams.id + "/testList/" + $scope.test.active));
                            $scope.r.$loaded().then(function () {
                                console.log($scope.r);
                                if ($scope.r.s == null || $scope.r.m == null) {
                                    $scope.r.s = 0;
                                    $scope.r.m = 15;
                                }
                                $scope.r.$save().then(function () {
                                    $scope.r.$bindTo($scope, "result").then(function () {
                                        setTimeout(timer(), 4000);
                                    })
                                })
                            })
                        })
                        $scope.test.$save();
                    }
                )
            });
    }

    $scope.answer = function (index, answer) {
        let question = $firebaseObject(firebase.database().ref('test/' + $scope.test.active + '/' + index));
        question.$loaded().then(function () {
            question.Answered = answer;
            question.$save();
        });
    }


    $scope.QuestionPage = 0;
    $scope.prevQ = function () {
        if ($scope.QuestionPage > 0) {
            $scope.QuestionPage--;
        }
    }

    $scope.nextQ = function () {
        if ($scope.QuestionPage < 9) {
            $scope.QuestionPage++;
        }
    }

    $scope.jumpQ = function (page) {
        $scope.QuestionPage = page;
    }

    $scope.finishTest = function () {
        if ($scope.r.m >= 10) {
            Swal.fire({
                icon: 'warning',
                title: 'Chưa được hoàn thành!',
                text: 'Bạn phải làm bài thi ít nhất 5 phút!',
            })
        } else {
            Swal.fire({
                title: 'Bạn đã hoàn thành bài thi?',
                icon: 'info',
                text: $scope.answers.includes(undefined) == true ? 'Bạn vẫn chưa điền hết câu trả lời!' : '',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Đã xong',
                cancelButtonText: 'Chưa xong'
            }).then(function (result) {
                if (result.value) {
                    $timeout.cancel(timerRun);
                    $scope.closeTest();
                }
            })
        }
    }

    $scope.$on("$destroy", function () {
        if (timerRun) {
            $timeout.cancel(timerRun);
        }
    });

    $scope.closeTest = function () {
        let mark = 0;
        for (let i = 0; i < $scope.answers.length; i++) {
            if ($scope.answers[i] == $scope.testQuestions[i].AnswerId) {
                mark++;
            }
        }
        let testID = $scope.test.active;
        $scope.test.active = null;
        $scope.test.$save().then(function () {
            if ($scope.r.m == 0 && $scope.r.s == 0) {
                $scope.r.m = 15;
                $scope.r.s = 00;
            } else {
                $scope.r.m = 14 - $scope.r.m;
                $scope.r.s = 60 - $scope.r.s;
            }

            $scope.r.mark = mark;
            var d = new Date();
            $scope.r.date = d.getDay() == 6 ? 'CN' : ("T" + (d.getDay() + 1)) + ' ' + d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();

            $scope.r.$save().then(function () {
                window.location.href = "#!test/result?id=" + testID + "&u=" + $routeParams.u + "&su=" + $routeParams.id;
            })
        });

    }
}

var ctrlTestResult = function ($scope, $routeParams, $timeout, $firebaseArray, $firebaseObject) {
    $scope.$on("$routeChangeError", function (event, next, previous, error) {
        if (error === "AUTH_REQUIRED") {
            $location.path("/home");
            authNotify.fire({
                icon: 'error',
                title: 'Chưa đăng nhập!'
            })
        }
    })

    $scope.questions = $firebaseArray(firebase.database().ref('test/' + $routeParams.id));
    $scope.result = $firebaseObject(firebase.database().ref('users/' + $routeParams.u + '/test/' + $routeParams.su + "/testList/" + $routeParams.id));

    $scope.archived = "";
    $scope.min = 0;
    $scope.sec = 0;
    $scope.mark = 0;

    var countUpTime = function () {
        $scope.sec++;
        $scope.min = ($scope.sec % 10 == 0 && $scope.min < $scope.result.m ? $scope.min + 1 : $scope.min);
        $scope.sec = ($scope.sec == 60 ? 0 : $scope.sec);

        if ($scope.sec === $scope.result.s && $scope.min === $scope.result.m) $timeout.cancel(countTime);
        else countTime = $timeout(countUpTime, 1);
    };

    var countUpMark = function () {
        if ($scope.mark == $scope.result.mark) {
            $timeout.cancel(countMark);
            $scope.archived = $scope.mark >= 6 ? "Đạt" : "Rớt";
        }
        else {
            countMark = $timeout(countUpMark, 300);
            $scope.mark++;
        }
    };

    $scope.initResult = function () {
        $scope.result.$loaded().then(function () {
            countUpTime();
            if ($scope.result.mark > 0)
                countUpMark();
            else
                $scope.archived = $scope.mark >= 6 ? "Đạt" : "Rớt";
        })

    }
}

//service
var authFirebase = function ($firebaseAuth) {
    return $firebaseAuth();
}






