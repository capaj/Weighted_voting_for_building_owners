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
 

namespace ownersVotingServer
{
    enum Roles
    {
        Normal, Admin
    }
    
    class User
	{
        public string Id { get; set; }
		public string nick { get; set; }
		public string hashedPwrd { get; set; }
        public string email { get; set; }
        public Roles role { get; set; }
        public ClientViewModel VM { get; set; }
        public IWebSocketConnection connection { get; set; }

	}

    class OwnerVotingsServer 
    {
        public List<User> allUsers { get; set; }
        public List<IWebSocketConnection> allSockets { get; set; }
        public List<CreateUserRequest> CURequestHistory { get; set; }
        public EmbeddableDocumentStore documentStore { get; set; }

        public OwnerVotingsServer(IDocumentStore docStore)
        {
            documentStore = (EmbeddableDocumentStore)docStore;
            allSockets = new List<IWebSocketConnection>();
            CURequestHistory = new List<CreateUserRequest>();
            using (var session = documentStore.OpenSession())
            {
                allUsers = session.Query<User>().ToList();

            }
        }

        public string AddNewlyCreatedUser(User newUser)
        {
            using (var session = documentStore.OpenSession())
            {
                session.Store(newUser);
                session.SaveChanges();
            }
            allUsers.Add(newUser);
            return newUser.Id;
        }

        public User FindUserByNickAndPWDhash(User user)
        {
            var ourUser = allUsers.Find(x => x.nick == user.nick && x.hashedPwrd == user.hashedPwrd);     //simple authentication
            return ourUser;
        }

        public User FindUserByNick(User user)
        {
            var ourUser = allUsers.Find(x => x.nick == user.nick);     //simple check if the user already exists
            return ourUser;
        }
    }
	
	static class Program
	{

        

		static void Main(string[] args)
		{
			FleckLog.Level = LogLevel.Debug;
			var server = new WebSocketServer("ws://localhost:8181");
           
            //bordel

            Vote mothersVote = new Vote { how = true, passive = false, name = "Paedr. Miroslava Špácová", voteStrength = 55 };
            Vote pazoursVote = new Vote { how = false, passive = false, name = "Pazour", voteStrength = 87 };
            List<Vote> votesList = new List<Vote>();
            votesList.Add(mothersVote);
            votesList.Add(pazoursVote);
            Voting firstVoting = new Voting { subject = "Prvni testovaci hlasovani", votes = votesList };
            Voting secondVoting = new Voting { subject = "Druhe testovaci hlasovani", votes = new List<Vote> { mothersVote } };

            OwnersMeeting firstMeeting = new OwnersMeeting { name = "Prvni testovaci schuze", date = DateTime.Today.AddDays(-30), maximumVoteCount = 240, votings = new List<Voting> { firstVoting } };
            OwnersMeeting secondMeeting = new OwnersMeeting { name = "Druha testovaci schuze", date = DateTime.Now, maximumVoteCount = 220, votings = new List<Voting> { secondVoting } };

            ClientViewModel jirisVM = new ClientViewModel { AllMeetings = new List<OwnersMeeting> { firstMeeting, secondMeeting } };


            User myTest = new User { nick = "Jiri", hashedPwrd = "a9993e364706816aba3e25717850c26c9cd0d89d", role = Roles.Admin, VM = jirisVM };
            //konec bordelu

			string jsonStr = JsonConvert.SerializeObject(myTest);
            var dStore = new EmbeddableDocumentStore { DataDirectory = "Data", }.Initialize();
            dStore.Initialize();
                var OVserver = new OwnerVotingsServer(dStore);
                OVserver.allUsers.Add(myTest);

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
                                if (OVserver.CURequestHistory.Any(x=> x.fromIP == newRequest.fromIP && (x.When-newRequest.When)<TimeSpan.FromHours(2)))
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
                                if ( ourUser != null)
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
                                User user = OVserver.FindUserByNickAndPWDhash(receivedObj.user);
                                   
                                if (user!=null)
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
