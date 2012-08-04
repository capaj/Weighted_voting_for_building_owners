/// <reference path= "knockout.debug.js" />
/* File Created: května 1, 2012 */


$(function () {
    var initModel = {
        name: "",
        password: "",
        loggedIn: false
    };

    var viewModel = ko.mapping.fromJS(initModel);

    ko.applyBindings(viewModel);

    var justUpdatedFromServer = {}
    var justUpdatedOnClient = {}

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
            }

            socket.onmessage = function (event) {
                message('<p class="message">Received: ' + event.data);
                //var msg =
                justUpdatedFromServer = JSON.parse(event.data);
                ko.mapping.fromJS(justUpdatedFromServer, viewModel)

            }

            socket.onclose = function () {
                message('<p class="event">Socket Status: ' + socket.readyState + ' (Closed)');
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
            $('#chatLog').append(msg + '</p>');
        }

        $('#text').keypress(function (event) {
            if (event.keyCode == '13') {
                send("Hello");
            }
        });

        $('#disconnect').click(function () {
            socket.close();
        });

        viewModel.login = function () {
            var hashed = Sha1.hash(this.password);
            console.log("Login request")
            var toSend = {msgType: "login", nick: name, HashedPwrd:hashed}
            send(ko.mapping.toJSON(toSend))
        }


//        function SubscribeObject(objectToSub) {
//            
//        }

        viewModel.name.subscribe(function (newValue) {
            console.log("The person's new name is " + newValue);
            if (justUpdatedFromServer["name"]) {
                console.log("Not sending the update to the server, it came from there")
                justUpdatedFromServer = {}
            } else {
                console.log("Sending the update back")
                var toSend = viewModel
                toSend["msgType"] = "update"
                send(ko.mapping.toJSON(toSend))
            }
        });

        //        viewModel.age.subscribe(function (newValue) {
        //            console.log("The person's new age is " + newValue);
        //            if (justUpdatedFromServer["age"]) {
        //                console.log("Not sending the update to the server, it came from there")
        //            } else {
        //                console.log("Sending the update back")
        //                send(ko.mapping.toJSON(viewModel))
        //            }
        //        });
    } //End else

    //    var viewModel = {
    //        name: ko.observable("Capaj")
    //    };
    //    ko.applyBindings(viewModel);



});