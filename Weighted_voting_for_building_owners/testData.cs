using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using OwnersVotingServer;

namespace Weighted_voting_for_building_owners
{
    static class testData
    {
        public static User GetTestUserData() {
            //test data

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


            User myTestUser = new User { nick = "George", hashedPwrd = "a9993e364706816aba3e25717850c26c9cd0d89d", role = Roles.Admin, VM = jirisVM };
            //OVserver.AddNewlyCreatedUser(myTest);
            //end of test data

            string jsonStr = JsonConvert.SerializeObject(myTestUser);

            return myTestUser;
        }
    }
}
