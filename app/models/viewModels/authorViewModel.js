class Author {
    constructor(name) {
        this.name = name;

        return this;
    }

    get getName() {
        return this.name;
    }

    set setName(value) {
        this.name = value;

        return this;
    }
}

export default Author;
