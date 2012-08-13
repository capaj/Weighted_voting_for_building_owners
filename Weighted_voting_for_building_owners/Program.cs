using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Fleck;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Raven.Client.Document;
using Raven.Client;
using Raven.Client.Connection;
using Raven.Client.Embedded;
using System.Security.Cryptography.X509Certificates;
using Weighted_voting_for_building_owners;

namespace OwnersVotingServer
{
    static class Program
    {
        static void Main(string[] args)
        {
            FleckLog.Level = LogLevel.Debug;
            var server = new WebSocketServer("ws://localhost:8181");

            //User pok = testData.GetTestUserData();    // some data for testing the app

            var dStore = new EmbeddableDocumentStore { DataDirectory = "Data", }.Initialize();
            dStore.Initialize();
            var OVserver = new OwnerVotingsServer(dStore);

            server.Start(socket =>
            {
                socket.OnOpen = () =>
                {
                    Console.WriteLine("Opened connection from IP: {0}", socket.ConnectionInfo.ClientIpAddress);
                    OVserver.allSockets.Add(socket);

                    //socket.Send(jsonStr);
                };
                socket.OnClose = () =>
                {
                    Console.WriteLine("Closed connection from IP: {0}", socket.ConnectionInfo.ClientIpAddress);
                    OVserver.allSockets.Remove(socket);
                };
                socket.OnMessage = message =>
                {
                    Console.WriteLine(message);

                    dynamic receivedObj = JObject.Parse(message);

                    var clientMsgType = (string)receivedObj.msgType;
                    switch (clientMsgType)
                    {
                        case "createUser":

                            User newUser = JsonConvert.DeserializeObject<User>(receivedObj.newUser.ToString());
                            CreateUserRequest newRequest = new CreateUserRequest(socket);
                            if (OVserver.CURequestHistory.Any(x => x.fromIP == newRequest.fromIP && (x.When - newRequest.When) < TimeSpan.FromHours(2)))
                            {

                                WebsocketMessage err = new WebsocketMessage { msgType = clientMsgType + "_response_fail", body = "Z kapacitních důvodů nelze vytvářet více účtů během 2 hodin." };
                                err.Send(socket);
                            }
                            else
                            {
                                var existingUser = OVserver.FindUserByNick(newUser);
                                if (existingUser == null)
                                {
                                    //we havent found user with that nick
                                    OVserver.CURequestHistory.Add(newRequest);
                                    newUser.VM = new ClientViewModel();
                                    OVserver.AddNewlyCreatedUser(newUser);
                                    WebsocketMessage succesMsg = new WebsocketMessage { msgType = clientMsgType + "_response_success" };
                                    succesMsg.Send(socket);
                                }
                                else
                                {
                                    Console.WriteLine("Create user failed, because a user with that login already exists");
                                    WebsocketMessage err = new WebsocketMessage { msgType = clientMsgType + "_response_fail", body = "Tento nick již existuje." };
                                    err.Send(socket);
                                }

                            }

                            break;
                        case "login":
                            Console.WriteLine("Login request");
                            User heWhoWantsToLogin = JsonConvert.DeserializeObject<User>(receivedObj.user.ToString());
                            var ourUser = OVserver.FindUserByNickAndPWDhash(heWhoWantsToLogin);
                            //var ourUser = myTest; // just for debug
                            if (ourUser != null)
                            {
                                //login successful
                                ourUser.connection = socket;
                                Console.WriteLine("Login granted, sending the model");
                                //ClientViewModel ConnectedUserVM = 
                                var msg = new WebsocketMessage { msgType = clientMsgType + "_response_succes", body = ourUser.VM };
                                msg.Send(socket);
                            }
                            else
                            {
                                Console.WriteLine("Login for nick" + heWhoWantsToLogin.nick + " failed");
                                WebsocketMessage err = new WebsocketMessage { msgType = clientMsgType + "_response_fail" };
                                err.Send(socket);
                            }
                            break;
                        case "logout":
                            Console.WriteLine("logout request");
                            User heWhoWantsToLogout = JsonConvert.DeserializeObject<User>(receivedObj.user.ToString());
                            User user = OVserver.FindUserByNickAndPWDhash(heWhoWantsToLogout);

                            if (user != null)
                            {
                                user.VM = JsonConvert.DeserializeObject<ClientViewModel>(receivedObj.user.VM.ToString());
                                using (var session = dStore.OpenSession())
                                {
                                    session.Store(user);
                                    session.SaveChanges();
                                }
                                WebsocketMessage succesMsg = new WebsocketMessage { msgType = clientMsgType + "_response_success" };
                                succesMsg.Send(socket);

                            }
                            else
                            {
                                WebsocketMessage err = new WebsocketMessage { msgType = clientMsgType + "_response_fail" };
                                err.Send(socket);
                            }
                            break;
                        case "loadAdminView": Console.WriteLine("load admin view request");
                            break;
                        case "saveAdminView": Console.WriteLine("save admin view request");

                            break;
                        default: Console.WriteLine("Unrecognized msgType");
                            WebsocketMessage unrecognizedCommmandResponse = new WebsocketMessage { msgType = clientMsgType + "_response_fail", body = clientMsgType + "Tento příkaz server nezná." };
                            unrecognizedCommmandResponse.Send(socket);
                            break;
                    }


                    //}
                };
            });


            var input = Console.ReadLine();
            while (input != "exit")
            {
                //foreach (var socket in allSockets.ToList())
                //{
                //    socket.Send(input);
                //}
                input = Console.ReadLine();
            }
        }

    }
}
