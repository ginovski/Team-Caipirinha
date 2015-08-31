import appConfig from 'app/config/appConfig'
import 'parse'

Parse.initialize(appConfig.parseConfig.applicationId, appConfig.parseConfig.javaScriptKey);

var user = (function() {
    function signIn(username, password) {
        //var promise = new Promise(function(resolve, reject) {
        //    Parse.User.logIn(username, password)
        //        .then(function() {
        //            resolve();
        //        }, function(err) {
        //            return Parse.User.signUp(username, password)
        //        })
        //        .then(resolve, reject);
        //});

        //return promise;

        Parse.User.logIn(username, password, {
            success: function(user) {
                // Do stuff after successful login.
            },
            error: function(user, error) {
                // The login failed. Check error to see why.
            }
        });
    }

    function signOut() {
        var promise = new Promise(function(resolve, reject) {
            Parse.User.logOut()
                .then(resolve, reject);
        });

        return promise;
    }

    function signUp(email, username, password) {
        var user = new Parse.User();

        user.set("email", email);
        user.set("username", username);
        user.set("password", password);

        //user.signUp(null, {
        //    success: function(user) {
        //        // Hooray! Let them use the app now.
        //    },
        //    error: function(user, error) {
        //        // Show the error message somewhere and let the user try again.
        //        alert("Error: " + error.code + " " + error.message);
        //    }
    }

    return {
        signIn,
        signUp,
        signOut
    }
}());

export default user;