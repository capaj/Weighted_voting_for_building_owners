using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace OwnersVotingServer
{
    public class Voting
    {
        private DateTime _enteredOn;

        public string subject { get; set; }
        public DateTime enteredOn
        {
            get
            {
                return _enteredOn;
            }
        }
        public List<Vote> votes { get; set; }

        public Voting()
        {
            _enteredOn = DateTime.UtcNow;
        }
    }

    public class Vote
    {
        public string name { get; set; }
        public Decimal voteStrength { get; set; }

        private bool _how;

        public bool how
        {
            get { return _how; }
            set
            {
                if (passive)
                {
                    _how = value;

                }
                else
                {
                    _how = false;
                }
            }
        }

        public bool passive { get; set; }
    }
}
