'use strict';
var textHelper = (function () {
    return {
        // helpText: 'You can store your workouts,'
        //     + ' find your workouts for a date, find your best for a workout,'
        //     + ' list all supported workouts, or clear your last workout. ',
        // examplesText: 'Here\'s some things you can say,'
        //     + ' Add 10 push ups,'
        //     + ' Store twenty Pull downs with 20 pounds,'
        //     + ' what\'s my best for push ups,'
        //     + ' get me all supported exercises,'
        //     + ' find my exercises on last friday,'
        //     + ' get my push ups on yesterday,'
        //     + ' correction,'
        //     + ' help'
        //     + ' and exit. What would you like? ',
        specifyAmount : 'How much did you spend ?',
        setBudgetHelp : 'You can try,'
                      + 'Set budget for groceries as fifty dollars for this month',

        specifyBudgetAmount : 'Budget not set because you have not specified an amount.',
        specifyAmountReprompt : 'Please specify an amount.',
        cannotCancel : 'You cannot remove the expense right now.',
        confirmCancellation : 'Are you sure you want to erase the last entry from your diary ?',
        cancelledExpense : 'The last expense entry has been erased from your diary.',
        dontCancel : 'Ok. I\'m retaining the entry in your diary.'
    };
})();
module.exports = textHelper;