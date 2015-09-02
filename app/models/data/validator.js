var validator = (function (){
    function isInRange(value, min, max, incl){
        if(typeof incl == 'undefined' || incl == null){
            incl = false;
        }
        var len = value.length;
            switch(incl){
                case false:
                    if(len > min && len < max){
                        return true;
                    }
                    return false;
                    break;
                case true:
                    if(len >= min && len <= max){
                        return true;
                    }
                    return false;
                    break;
            }
    }

    function isValidName(value){
        if(!value.match(/^[a-z]+$/i)){
            return false;
        }
        return true;
    }

    function isbnValidator(value){
        var isbnValue = value.toString().toLowerCase().replace(/-/g, "");
        if(isbnValue.match(/[a-z]/i) || isbnValue.length != 13 && isbnValue.length != 10) {
            return false;
        }
        if(isbnValue.length == 10){
            isbnValue = "978" + isbnValue;
        }

        var i,
            mod,
            sum = 0,
            len = isbnValue.length-1;
        for(i = 0;  i < len; i+=1){
            if(i%2 == 0){
                sum += parseInt(isbnValue.charAt(i), 10)*1;
            } else {
                sum += parseInt(isbnValue.charAt(i), 10)*3;
            }
        }
        mod = sum%10;

        if(10 - mod !== parseInt(isbnValue.charAt(12))){
            return false;
        }

        return true;
    }

    return{
        isbnValidator: isbnValidator,
        isInRange: isInRange,
        isValidName: isValidName
    };
}());