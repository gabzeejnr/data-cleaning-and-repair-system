String.prototype.capitalize = function () {
    return this
        .charAt(0)
        .toUpperCase() + this
            .slice(1)
            .toLowerCase();
}

String.prototype.sentenceCase = function () {
    return this
        .toLowerCase()
        .replace(/(^\s*\p{L}|[.!?]\s*\p{L})/gu,
            match => match.toUpperCase()
        )
}

export { }