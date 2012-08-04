/// <reference path= "knockout.debug.js" />
/* File Created: května 1, 2012 */


$(function () {
    //    var viewModel = {
    //        name: ko.observable("Capaj")
    //    };
    //    ko.applyBindings(viewModel);
    var SimpleListModel = function (items) {
        var self = this;
        this.items = ko.observableArray(items);
        this.inputName = ko.observable("");
        this.inputVotes = ko.observable("");

        this.addItem = function () {
            if (this.inputName() != "") {
                var item = {
                    selected: ko.observable(false),
                    name: this.inputName(),
                    votes: this.inputVotes(),
                    present: ko.observable(false),
                    removeIt: function () {
                        console.log("Deleting the item")
                        self.items.remove(item)
                    }
                };
                this.items.push(item); // Adds the item. Writing to the "items" observableArray causes any associated UI to update.
                this.inputName("");
                this.inputVotes(""); // Clears the text box, because it's bound to the "itemToAdd" observable
            }
        } .bind(this); // Ensure that "this" is always this view model

        this.presentOwners = ko.computed(function () {

            return ko.utils.arrayFilter(self.items(), function (item) {
                return item.present();
            });
        });

        this.selectedItems = ko.computed(function () {

            return ko.utils.arrayFilter(self.items(), function (item) {
                return item.selected();
            });
        });

        this.votesSum = ko.computed(function () {
            ret = 0
            ko.utils.arrayForEach(self.items(), function (item) {
                ret = ret + parseInt(item.votes);
            });
            return ret;
        });

        this.votesPresentSum = ko.computed(function () {
            ret = 0
            ko.utils.arrayForEach(self.items(), function (item) {
                if (item.present()) {
                    ret = ret + parseInt(item.votes);
                }
            });
            return ret;
        });

        this.selectedVotes = ko.computed(function () {
            ret = 0
            ko.utils.arrayForEach(self.selectedItems(), function (item) {
                ret = ret + parseInt(item.votes);
            });
            return ret;
        });

        this.selectedVotesPercentage = ko.computed(function () {
            if (parseInt(self.votesSum()) >= self.selectedVotes()) {
                return (self.selectedVotes() / parseInt(self.votesSum())) * 100;
            } else {
                return "Chyba: Celkem hlasů je méně než hlasů vybraných";
            }
        });

        this.selectedVotesPercentagePresent = ko.computed(function () {
            if (self.presentOwners().length > 0) {
                if (parseInt(self.votesPresentSum()) >= self.selectedVotes()) {
                    return (self.selectedVotes() / parseInt(self.votesPresentSum())) * 100;
                } else {
                    return "Chyba: Celkem hlasů je méně než hlasů vybraných";
                }
            } else {
                return "Nikdo není přítomen";
            }
        });

        this.removeSelected = function () {
            //this.items.remove(function() {for (var item in this.items()) {   }});
            this.items.removeAll(this.selectedItems());

            this.selectedItems([]); // Clear selection
        };
    };

    ko.applyBindings(new SimpleListModel([
    //        {
    //            selected: ko.observable(false),
    //            name: "Alpha",
    //            votes: 100,
    //            present: ko.observable(false)
    //        }
    ]));
});



(function () {
    function rawNumber(val) {
        return Number(val.toString().replace(/[^\d\.\-]/g, ''));
    }

    function number_format(number, decimals, dec_point, thousands_sep) {
        // Formats a number with grouped thousands  
        // 
        // *     example 1: number_format(1234.56);
        // *     returns 1: '1,235'
        // *     example 2: number_format(1234.56, 2, ',', ' ');
        // *     returns 2: '1 234,56'
        // *     example 3: number_format(1234.5678, 2, '.', '');    // *     returns 3: '1234.57'
        // *     example 4: number_format(67, 2, ',', '.');
        // *     returns 4: '67,00'
        // *     example 5: number_format(1000);
        // *     returns 5: '1,000'    // *     example 6: number_format(67.311, 2);
        // *     returns 6: '67.31'
        // *     example 7: number_format(1000.55, 1);
        // *     returns 7: '1,000.6'
        // *     example 8: number_format(67000, 5, ',', '.');    // *     returns 8: '67.000,00000'
        // *     example 9: number_format(0.9, 0);
        // *     returns 9: '1'
        // *    example 10: number_format('1.20', 2);
        // *    returns 10: '1.20'    // *    example 11: number_format('1.20', 4);
        // *    returns 11: '1.2000'
        // *    example 12: number_format('1.2000', 3);
        // *    returns 12: '1.200'
        // *    example 13: number_format('1 000,50', 2, '.', ' ');    // *    returns 13: '100 050.00'
        number = (number + '').replace(',', '').replace(' ', '');
        var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
        dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
        s = '',
        toFixedFix = function (n, prec) {
            var k = Math.pow(10, prec);
            return '' + Math.round(n * k) / k;
        };
        // Fix for IE parseFloat(0.55).toFixed(0) = 0;
        s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
        if (s[0].length > 3) {
            s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
        }
        if ((s[1] || '').length < prec) {
            s[1] = s[1] || '';
            s[1] += new Array(prec - s[1].length + 1).join('0');
        }
        return s.join(dec);
    }

    ko.numericObservable = function (initialValue) {
        var _value = ko.observable(),
        result = ko.dependentObservable({
            read: _value,
            write: function (newValue) {
                _value(number_format(rawNumber(newValue)));
            },
            owner: result
        });

        result(initialValue); //run the initial value through 
        return result;
    };
})();
