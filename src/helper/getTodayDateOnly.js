const getTodayDateOnly = function () {
    const today = new Date()
    return today.toISOString().slice(0,10)
}

module.exports = getTodayDateOnly