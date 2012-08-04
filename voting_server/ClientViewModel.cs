using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data;
using System.ComponentModel;
using Raven.Database;
using Raven.Client.Document;
using Raven.Client;
using Raven.Client.Connection;
using Raven.Client.Embedded;


namespace ownersVotingServer
{
    public class ClientViewModel 
    {
        public List<OwnersMeeting> AllMeetings { get; set; }

        public void Save(EmbeddableDocumentStore documentStore)
        {
            using (var session = documentStore.OpenSession())
            {
                session.Store(this);

                session.SaveChanges();

            }
        }
    }
    
    class oldobsoleteClientViewModel:INotifyPropertyChanged
    {
        private bool loggedIn;

        public bool MyProperty
        {
            get { return loggedIn; }
            set
            {
                if (value != loggedIn)
                {
                    loggedIn = value;
                    NotifyPropertyChanged("loggedIn");
                }
               
            }
        }

        public List<OwnersMeeting> Meetings { get; set; }

        private void NotifyPropertyChanged(String info)
        {
            if (PropertyChanged != null)
            {
                PropertyChanged(this, new PropertyChangedEventArgs(info));
            }
        }

        public event PropertyChangedEventHandler PropertyChanged;

        public void Save(EmbeddableDocumentStore documentStore)
        {
            using (var session = documentStore.OpenSession())
            {
                session.Store(this);

                session.SaveChanges();
               
            }
        }
    }
}
