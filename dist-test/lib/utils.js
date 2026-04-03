"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDaysLeft = getDaysLeft;
exports.getPulseStatus = getPulseStatus;
exports.sanitizeText = sanitizeText;
function getDaysLeft(expiryDate) {
    var expiry = new Date(expiryDate);
    var today = new Date();
    var expiryMidnight = Date.UTC(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
    var todayMidnight = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.round((expiryMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
}
function getPulseStatus(daysLeft) {
    if (daysLeft < 0)
        return "expired";
    if (daysLeft < 7)
        return "urgent";
    if (daysLeft <= 30)
        return "warning";
    return "safe";
}
function sanitizeText(input) {
    return input.replace(/<[^>]*>?/gm, "").trim().slice(0, 255);
}
