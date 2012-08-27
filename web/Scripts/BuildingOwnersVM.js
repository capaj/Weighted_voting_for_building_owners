/// <reference path= "knockout.debug.js" />
/* File Created: května 22, 2012 */
function GetDateStrFromJsonDate(jsonDate) {
    var date = new Date(jsonDate);
    return GetDateStrFromDate(date);
}

function GetDateStrFromDate(date) {
    var month = date.getMonth() + 1;    //because it is in array indexed from 0
    var dateStr = date.getDate() + "." + month + "." + date.getFullYear();
    return dateStr;
}

function GetDateFromString(strDate) {
    var dateParts = strDate.split(".");
    return new Date(dateParts[2], (dateParts[1] - 1), dateParts[0]);
}

function voteCount(votesToCount) {
    var ret = 0;
    ko.utils.arrayForEach(votesToCount, function (vote) {
        ret = ret + parseInt(vote.voteStrength());
    });
    return ret;
}

function Meeting(meeting) {
    if (meeting.date instanceof Date) {
        meeting.date = GetDateStrFromDate(meeting.date);
    } else {
        meeting.date = GetDateStrFromJsonDate(meeting.date);
    }
    meeting.votingsCount = ko.computed(function () {
        return meeting.votings.length;
    });

    var votingsBuffer = [];
    $.each(meeting.votings,
        function (key, voting) {
            votingsBuffer.push(new Voting(voting));
        }
    );

    this.votings = ko.observableArray(votingsBuffer);
    return meeting;
}

function Voting(voting) {
    voting.votes = ko.mapping.fromJS(voting.votes);

    voting.enteredOn = GetDateStrFromJsonDate(voting.enteredOn);
    voting.positiveVotesCount = ko.computed(function () {
        var positiveVotesOnOne = ko.utils.arrayFilter(voting.votes(),
            function (item) {
                return item.how() && !(item.passive());
            }
        );

        return voteCount(positiveVotesOnOne);
    });
    voting.negativeVotesCount = ko.computed(function () {
        var negativeVotesOnOne = ko.utils.arrayFilter(voting.votes(),
            function (item) {
                return !(item.how()) && !(item.passive());
            }
        );

        return voteCount(negativeVotesOnOne);
    });
    return voting;
}

$(function () {
    var noMeeting = {
        name: "nevybrána žádná schůze",
        date: "",
        maximumVoteCount: null,
        votings: [],
    };

    var noVoting = {
        subject: "nevybrána žádné hlasování",
        enteredOn: "",
        votes: []
    };

    var initModel = {
        name: "",
        password: "",
        passwordForVerification: "",
        agreesToTerms: false,
        email: "",
        loggedIn: false,
        connected: false,
        Id: "",
        AllMeetings: [],
        meetingName: "",
        meetingDate: "",
        selectedMeeting: noMeeting,
        selectedVoting: noVoting,
        selectedMeetingIndex: null,
        selectedVotingIndex: null,
        //newMeeting
        newMeetingName: "",
        newMeetingDate: "",
        newMeetingMaximumVoteCount: 0,
        //newVoting
        newVotingSubject: "",
        //newVote
        newVoteName: "",
        newVoteStrength: 0,
    };

    var VM = ko.mapping.fromJS(initModel);

    //debug help
    VM.AllMeetings.subscribe(function () {
        console.log(VM.AllMeetings());
    })


    VM.ShowCreateUserModal = function () {
        $('#myCreateUserModal').modal('show')
    };

    VM.addMeeting = function (meeting) {
        //VM.AllMeetings.push(meeting);
        VM.AllMeetings.push(ko.mapping.fromJS(meeting));
    }

    VM.CreateNewMeeting = function () {
        VM.addMeeting(
            new Meeting(
                {
                    name: VM.newMeetingName(),
                    date: GetDateFromString($('#dpicker').attr("value")),
                    maximumVoteCount: VM.newMeetingMaximumVoteCount(),
                    votings: []
                }
            )
        );
        //taking care of the input fields
        $('#dpicker').attr("value", "");
        VM.newMeetingName("");
        VM.newMeetingMaximumVoteCount(0);
    };

    VM.CreateNewVoting = function () {
        var newVoting = new Voting(
            {
                subject: VM.newVotingSubject(),
                enteredOn: (new Date()).toJSON(),
                votes: []
            });
        VM.AllMeetings()[VM.selectedMeetingIndex()].votings.push(ko.mapping.fromJS(newVoting));
    };

    VM.addNewVote = function () {
        var newVote =
            {
                name: VM.newVoteName(),
                voteStrength: VM.newVoteStrength(),
                how: false,
                passive: false
            };
        VM.AllMeetings()[VM.selectedMeetingIndex()].votings()[VM.selectedVotingIndex()].votes.push(ko.mapping.fromJS(newVote));
    };

    // Selected meeting
    function GetMeetingProperty(property) {
        var all = VM.AllMeetings()
        if (VM.selectedMeetingIndex() === null) {
            return noMeeting[property];
        } else {
            return all[VM.selectedMeetingIndex()][property]();
        }
    };
  
    VM.hashedPswd = ko.computed(
        function () {
            return Sha1.hash(VM.password());
        }
    );

    VM.selectedMeeting.name = ko.computed(
        function () {
            return GetMeetingProperty("name");
        }
    );

    VM.selectedMeeting.date = ko.computed(
        function () {
            return GetMeetingProperty("date");
        }
    );

    VM.selectedMeeting.maximumVoteCount = ko.computed(
        function () {
            return GetMeetingProperty("maximumVoteCount");
        }
    );

    VM.selectedMeeting.votings = ko.computed(
        function () {
            return GetMeetingProperty("votings");
        }
    );
    //seleted voting
    function GetVotingProperty(property) {
        var all = VM.AllMeetings()
        if (VM.selectedMeetingIndex() === null) {
            return noVoting[property];
        } else {
            var allV = all[VM.selectedMeetingIndex()].votings()
            if (VM.selectedVotingIndex() === null) {
                return noVoting[property];
            } else {
                if (allV[VM.selectedVotingIndex()]) {
                    return allV[VM.selectedVotingIndex()][property]();
                } else {
                    return noVoting[property];
                }
            }
        }
    }

    VM.selectedVoting.subject = ko.computed(
        function () {
            return GetVotingProperty("subject");
        }
    );

    VM.selectedVoting.enteredOn = ko.computed(
        function () {
            return GetVotingProperty("enteredOn");
        }
    );
    
    VM.selectedVoting.votes = ko.computed(
        function () {
            return GetVotingProperty("votes");
        }
    );

    VM.votesSum = ko.computed(function () {
        return voteCount(VM.selectedVoting.votes());
    });

    VM.votesPassiveSum = ko.computed(function () {
        var passiveVotes = ko.observableArray();
        ko.utils.arrayForEach(VM.selectedVoting.votes(), function (item) {
            if (item.passive()) {
                passiveVotes.push(item)
            }
        });
        return voteCount(passiveVotes());
    });

    VM.positiveVotes = ko.computed(function () {
        return ko.utils.arrayFilter(VM.selectedVoting.votes(), function (item) {
            if (!item.passive()) {
                return item.how();
            } else {
                return false;
            }
        });
    });

    VM.negativeVotes = ko.computed(function () {
        return ko.utils.arrayFilter(VM.selectedVoting.votes(), function (item) {
            if (!item.passive()) {
                return !item.how();
            } else {
                return false;
            }
        });
    });

    VM.passiveVotes = ko.computed(function () {
        return ko.utils.arrayFilter(VM.selectedVoting.votes(), function (item) {
            return item.passive();
        });
    });

    VM.notPassiveVotes = ko.computed(function () {
        return ko.utils.arrayFilter(VM.selectedVoting.votes(), function (item) {
            return !item.passive();
        });
    });
    VM.notPassiveVotesCount = ko.computed(function () {
        var ret = 0;
        ko.utils.arrayForEach(VM.notPassiveVotes(), function (item) {
            ret = ret + parseInt(item.voteStrength());
        });
        return ret;
    });

    VM.positiveVotesCount = ko.computed(function () {
        var ret = 0;
        ko.utils.arrayForEach(VM.positiveVotes(), function (item) {
            ret = ret + parseInt(item.voteStrength());
        });
        return ret;
    });

    VM.negativeVotesCount = ko.computed(function () {
        var ret = 0;
        ko.utils.arrayForEach(VM.negativeVotes(), function (item) {
            ret = ret + parseInt(item.voteStrength());
        });
        return ret;
    });

    VM.positiveVotesPercentageAll = ko.computed(function () {
        if (VM.selectedMeeting.maximumVoteCount) {

            if (parseInt(VM.selectedMeeting.maximumVoteCount()) >= VM.positiveVotesCount()) {
                return (VM.positiveVotesCount() / parseInt(VM.selectedMeeting.maximumVoteCount())) * 100;
            } else {
                return "Chyba: Celkem hlasů je méně než hlasů vybraných";
            }
        }
    });

    VM.positiveVotesPercentageFromThoseWhoVoted = ko.computed(function () {
        var activeVotesCount = parseInt(VM.notPassiveVotesCount());
        if (VM.notPassiveVotes().length > 0) {
            if (activeVotesCount >= VM.positiveVotesCount()) {
                return (VM.positiveVotesCount() / activeVotesCount) * 100;
            } else {
                return "Chyba: Celkem hlasů je méně než hlasů hlasujících pro";
            }
        } else {
            return "Nikdo nehlasoval";
        }
    });

    VM.positiveVotesPercentageFromPresent = ko.computed(function () {
        if (VM.notPassiveVotes().length > 0) {
            if (parseInt(VM.votesSum()) >= VM.positiveVotesCount()) {
                return (VM.positiveVotesCount() / parseInt(VM.votesSum())) * 100;
            } else {
                return "Chyba";
            }
        } else {
            return "Chyba: hlasů pro je více jak všech hlasů dohromady";
        }
    });

    //VM.selectedMeeting = ko.computed(function () {
    //    return VM.AllMeetings()[VM.selectedMeetingIndex()];
    //});

    //VM.selectedVoting = ko.computed(function () {
    //    if (VM.AllMeetings[VM.selectedMeetingIndex]) {
    //        return VM.AllMeetings[VM.selectedMeetingIndex].votings[VM.selectedVotingIndex]
    //    } else {
    //        return ko.observableArray([]);
    //    }
    //});

    VM.removeMeeting = function(meeting) {
        var index = VM.AllMeetings.indexOf(meeting);
        if (index === VM.selectedMeetingIndex()) {
            VM.selectedMeetingIndex(null)
        }
        VM.AllMeetings.remove(meeting);
    };
    
    VM.removeVoting = function (voting) {
        var index = VM.AllMeetings()[VM.selectedMeetingIndex()].votings().indexOf(voting);
        if (index === VM.selectedVotingIndex()) {
            VM.selectedVotingIndex(null)
        }
        VM.AllMeetings()[VM.selectedMeetingIndex()].votings.remove(voting);
    };

    VM.removeVote = function (vote) {
        VM.AllMeetings()[VM.selectedMeetingIndex()].votings()[VM.selectedVotingIndex()].votes.remove(vote);
        //VM.selectedVoting.votes.remove(vote);
    };

    VM.editMeeting = function (meeting) {
        var index = VM.AllMeetings.indexOf(meeting);
        VM.selectedMeetingIndex(index);

        $('li.active').next().find('a[data-toggle="tab"]').click();     // this ensures that the tab with meeting will be shown
    }

    VM.editVoting = function (voting) {
        var index = VM.AllMeetings()[VM.selectedMeetingIndex()].votings().indexOf(voting);
        VM.selectedVotingIndex(index);
        //VM.selectedVoting.votes(voting.votes())
        //VM.selectedVoting.subject(voting.subject())
        //VM.selectedVoting.enteredOn(voting.enteredOn())
        
        $('li.active').next().find('a[data-toggle="tab"]').click();     // this ensures that the tab with meeting will be shown
    }

    if (!("WebSocket" in window)) {
        console.log("Websockets not suppported");
        $('<p>Oh no, you need a browser that supports WebSockets. How about <a href="http://www.google.com/chrome">Google Chrome</a>?</p>').appendTo('#container');
    } else {
        //The user has WebSockets

        var socket;
        var host = "ws://localhost:8181";

        try {
            var socket = new WebSocket(host);

            message('<p class="event">Socket Status: ' + socket.readyState);

            socket.onopen = function () {
                message('<p class="event">Socket Status: ' + socket.readyState + ' (open)');
                VM.connected(true);
            }

            socket.onmessage = function (event) {   //this should happen just once(after login) through the whole use cycle
                message('<p class="message">Received: ' + event.data);
                var msgfromServer = JSON.parse(event.data);
                
                switch(msgfromServer.msgType)
                {
                    case "login_response_succes":
                        VM.loggedIn(true);
                        $.each(msgfromServer.body.AllMeetings,
                            function (key, meeting) {
                                VM.addMeeting(new Meeting(meeting));
                            }

                        );
                        ko.mapping.fromJS(msgfromServer.body, VM)
                        $('#dpicker').datepicker(); //enabling the functionality for js/bootstrap-datepicker.js
                        break;
                    case "login_response_fail":
                        var fail = "Vámi zadané údaje neodpovídají žádnému záznamu na servru.";
                        break;
                    case "createUser_response_succes":
                        var resp = "Váš účet byl vytvořen.";
                        break;
                    case "createUser_response_fail":
                        var fail = msgfromServer.body;      // může být vícero důvodů, jedině server ten důvod ví
                        break;
                    case "logout_response_succes":
                        var resp = "Váš účet byl úspěšně uložen na servru.";
                        break;
                    case "logout_response_fail":
                        var fail = "Váš účet nebyl nalezen na servru.";
                        break;
                        
                    default:
                        
                }

               

            }

            socket.onclose = function () {
                message('<p class="event">Socket Status: ' + socket.readyState + ' (Closed)');
                VM.connected(false);
            }

        } catch (exception) {
            message('<p>Error' + exception);
        }

        function send(msgToServer) {
            try {
                socket.send(msgToServer);
                message('<p class="event">Sent: ' + msgToServer)

            } catch (exception) {
                message('<p class="warning">');
            }
        }

        function message(msg) {
            $('#WebsocketsLog').append(msg + '</p>');
        }

        $('#text').keypress(function (event) {
            if (event.keyCode == '13') {
                send("Hello");
            }
        });

        VM.disconnect = function () {
            socket.close();
        };

        VM.readyForLoginAttempt = ko.computed(function () {
            return (VM.name().length > 0 && VM.password().length > 0 && VM.connected());
        });

        VM.readyForCreateUserAttempt = ko.computed(function () {
            return (VM.name().length > 0 && VM.password().length > 0 && VM.connected() && VM.email().length > 0 && VM.agreesToTerms());
        });

        VM.logout = function () {
            var toSend =
                {
                    msgType: "logout",
                    user: { nick: VM.name, hashedPwrd: VM.hashedPswd, VM: VM }
                };
            send(ko.mapping.toJSON(toSend));
        };

        VM.login = function () {

            console.log("Login request")
            var toSend =
                {
                    msgType: "login",
                    user: { nick: VM.name, hashedPwrd: VM.hashedPswd }
                };
            send(ko.mapping.toJSON(toSend));
        }

        VM.createUser = function () {
            if (VM.password==VM.passwordForVerification) {

               
                console.log("Create user request")
                var toSend = 
                {
                    msgType: "createUser",
                    newUser: { nick: VM.name, hashedPwrd: VM.hashedPswd, email: VM.email }
                };
                send(ko.mapping.toJSON(toSend));
            } else {
                log("User has mispelled his password");
            }
        }
        ko.applyBindings(VM);

       
    } //End else

   

});

