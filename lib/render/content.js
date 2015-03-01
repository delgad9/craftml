module.exports = function(render, element, scope) {
    // scope.parent is important for getting nested <content> tags ot work
    return render(scope.caller.children, scope.parent)
}