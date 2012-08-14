using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Fleck;
using OwnersVotingServer;
using Raven.Client;
using Raven.Client.Embedded;

namespace Weighted_voting_for_building_owners
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
                Console.WriteLine("Loaded {0} users from DB on the hard drive", allUsers.Count);
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

        public User FindUserByNick(string nickName)
        {
            var ourUser = allUsers.Find(x => x.nick == nickName);     //simple check if the user already exists
            return ourUser;
        }
    }
   
}
