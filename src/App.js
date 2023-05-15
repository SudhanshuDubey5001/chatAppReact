import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import { API, graphqlOperation } from '@aws-amplify/api';
import { listMessages, messagesByChannelID } from './graphql/queries';

// Placeholder function for handling changes to our chat bar
const handleChange = () => { };

// Placeholder function for handling the form submission
const handleSubmit = () => { };

function App() {

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
  }, [])

  return (
    <div className="container">
      <div className="messages">
        <div className="messages-scroller">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={msg.author === 'Dave' ? 'message me' : 'message'}>{msg.body}</div>
          ))}
        </div>
      </div>
      <div className="chat-bar">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="messageBody"
            placeholder="Type your message here"
            onChange={handleChange}
            value={''}
          />
        </form>
      </div>
    </div>
  );
}

export default App;
