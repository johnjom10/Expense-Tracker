'use strict'
var textHelper = (function () {
  return {
    helpText: 'You can add your expenses,' +
      ' set overall and category-wise budgets for a month,' +
      ' know your spending habits, find out in what category you spent the most,' +
      ' list all available categories, cancel your last expense, or deduct an amount from your diary. ',
    examplesText: "Here's some things you can try," +
      ' Spent fifty dollars on groceries today,' +
      ' Set budget for shopping as two hundred dollars for this month ,' +
      ' how much did i spend on travel last month,' +
      ' list all available categories,' +
      ' list the expenses of today,' +
      ' strike that,' +
      ' deduct five dollars from groceries on June,' +
      ' i am confused help me,' +
      ' and exit. What do you want to do ?',
    specifyAmount: 'Please specify an amount .',
    setBudgetHelp: 'You can try,' +
      'Set budget for groceries as fifty dollars for this month',

    specifyBudgetAmount: 'Budget not set because you have not specified an amount.',
    specifyAmountReprompt: 'Please specify an amount.',
    cannotCancel: 'You cannot remove the expense right now.',
    confirmCancellation: 'Are you sure you want to erase the last entry from your diary ?',
    cancelledExpense: 'The last expense entry has been erased from your diary.',
    dontCancel: "Ok. I'm retaining the entry in your diary."
  };
})();
module.exports = textHelper;
