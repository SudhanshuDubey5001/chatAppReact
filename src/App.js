import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import { API, graphqlOperation } from '@aws-amplify/api';
import { listMessages, messagesByChannelID } from './graphql/queries';
import '@aws-amplify/pubsub';
import { onCreateMessage } from './graphql/subscriptions';
import { createMessage } from './graphql/mutations';
import { withAuthenticator, Authenticator } from '@aws-amplify/ui-react';
import { Auth } from 'aws-amplify';


function App() {

  //lets setup the user auth first 
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    Auth.currentUserInfo()
      .then((userInfo) => {
        setUserInfo(userInfo);
        console.log(userInfo);
      });
  }, []);

  const [messageBody, setMessageBody] = useState('');

  const handleChange = (event) => {
    setMessageBody(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const input = {
      channelID: '1',
      author: userInfo.id,
      body: messageBody.trim()
    };

    try {
      //first empty the text box once submit is pressed
      setMessageBody('');
      await API.graphql(graphqlOperation(createMessage, { input }))
    } catch (error) {
      console.warn(error);
    }
  };

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    API
      .graphql(graphqlOperation(messagesByChannelID, {
        channelID: '1',
        sortDirection: 'ASC'
      }))
      .then((response) => {
        const items = response.data?.messagesByChannelID?.items
        if (items) {
          console.log(items);
          setMessages(items);
        }
      })
  }, []);


  //to send messages we will - 
  // We subscribed to create mutations (onCreateMessage subscription) 
  //using the Amplify API library using API.graphql(...).subscribe(...). 
  //This returns a reference to the subscription so we can eventually unsubscribe from it 
  //during clean-up.
  // We passed an object containing our callbacks to the .subscribe(...) function and it 
  //looks something like this:

  // {
  //   next: (event) => {
  //     // do something with event
  //   },
  //   error: (error) => {
  //     // raise or handle error
  //   }
  // }

  useEffect(() => {
    const subscriptions = API
      .graphql(graphqlOperation(onCreateMessage))
      .subscribe({
        next: (event) => {
          setMessages([...messages, event.value.data.onCreateMessage]);
        }
      });
    return () => {
      subscriptions.unsubscribe();
    }
  }, [messages]);

  //So once subscribed, every new message created will trigger our next callback function 
  //that accepts an event argument. 
  //Using the event, we can add the new message into our component's 
  //state by appending event.value.data.onCreateMessage to our list of messages.



  return (
    <div className="app">
      {userInfo && (
        <div className="header">
          <div className="profile">
            You are logged in as: <strong>{userInfo.username}</strong>
          </div>
          <Authenticator>
            {({ signOut, user }) => (
              <div className="App">
                <button onClick={signOut}>Sign out</button>
              </div>
            )}
          </Authenticator>
        </div>
      )}
      <div className="container">
        <div className="messages">
          <div className="messages-scroller">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={msg.author === userInfo?.id ? 'message me' : 'message'}>{msg.body}</div>
            ))}
          </div>
        </div>
        <div className="chat-bar">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="message"
              placeholder="Type your message here"
              disabled={userInfo === null}
              onChange={handleChange}
              value={messageBody}
            />
          </form>
        </div>
      </div>
    </div>
  );
}

export default withAuthenticator(App);
