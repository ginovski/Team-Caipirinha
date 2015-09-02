class Author {
    constructor(name) {
        this.name = name;

        return this;
    }

    get getName() {
        return this.name;
    }

    set setName(value) {
        if(!validator.isValidName(value) || !validator.isInRange(value, 2, 40)){
            alert('Incorrect format for author name!');
        }
        this.name = value;

        return this;
    }
}

export default Author;
