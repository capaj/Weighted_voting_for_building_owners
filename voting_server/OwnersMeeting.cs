using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ownersVotingServer
{
    public class OwnersMeeting
    {
        public string name { get; set; }
        public DateTime date { get; set; }
        public int maximumVoteCount { get; set; }
        public List<Voting> votings { get; set; }
    }
}
