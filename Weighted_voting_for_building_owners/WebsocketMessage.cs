using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Fleck;
using Newtonsoft.Json;

namespace OwnersVotingServer
{
    class WebsocketMessage
    {
        public string msgType { get; set; }
        public dynamic body { get; set; }

        public void Send(IWebSocketConnection connectionToRecipient)
        {
            connectionToRecipient.Send(JsonConvert.SerializeObject(this));
        }
    }

}
