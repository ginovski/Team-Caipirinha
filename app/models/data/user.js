import appConfig from 'app/config/appConfig';
import 'parse';

Parse.initialize(appConfig.parseConfig.applicationId, appConfig.parseConfig.javaScriptKey);

var user = (function () {
    function signIn(username, password) {
        return Parse.User.logIn(username, password);
    }

    function signOut() {
        return Parse.User.logOut();
    }

    function signUp(email, username, password) {
        var user = new Parse.User();

        user.set("email", email);
        user.set("username", username);
        user.set("password", password);

        return user.signUp(null);
    }

    function getCurrentUser() {
        return Parse.User.current();
    }

    return {
        signIn,
        signUp,
        signOut,
        getCurrentUser
    };
}());

export default user;