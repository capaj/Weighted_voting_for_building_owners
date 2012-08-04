using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Fleck;
using Raven.Client.Document;
using Raven.Client;
using Raven.Client.Connection;
using Raven.Client.Embedded;

namespace ownersVotingServer
{
    class CreateUserRequest
    {
        public string fromIP { get; set; }
        public DateTime When { get; set; }

        public CreateUserRequest(IWebSocketConnection socket)
        {
            Console.WriteLine("new create user request has is created");
            When = DateTime.Now;
            fromIP = socket.ConnectionInfo.ClientIpAddress;
        }

      
    }
}
