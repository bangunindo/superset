import { useState, useEffect } from 'react';
import Button from 'src/components/Button';

const ChatAssistant = () => {
  const [dataset, setDataset] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    setMessages([
      { sender: 'bot', text: 'Please select a dataset first.' }, 
      ...messages,
    ]);
  }, []);

  useEffect(() => {
    if (dataset) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'bot', text: `You selected ${dataset}, How can I help you?` },
      ]);
    }
  }, [dataset]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && dataset) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'user', text: inputMessage },
      ]);
      setInputMessage('');

      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: `Response to "${inputMessage}"` },
        ]);
      }, 1000); 
    }
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <select
          value={dataset}
          onChange={(e) => setDataset(e.target.value)}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #374151',
            appearance: 'none',
            outline: 'none',
            fontSize: '16px',
            color: '#333',
            transition: 'all 0.2s ease-in-out',
            width: '100%', 
            maxWidth: '200px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'} // Mengganti latar belakang pada hover
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'} // Kembali ke latar belakang asal saat tidak hover
        >
          <option value="" disabled>
            Pilih Dataset
          </option>
          <option value="dataset1">Dataset 1</option>
          <option value="dataset2">Dataset 2</option>
          <option value="dataset3">Dataset 3</option>
        </select>
      </div>

      {/* Chat Display */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
        {messages.map((message, index) => (
          <div key={index} style={{ marginBottom: '8px', textAlign: message.sender === 'user' ? 'right' : 'left' }}>
            <div style={{ display: 'inline-block', backgroundColor: message.sender === 'user' ? '#007bff' : '#e9ecef', color: message.sender === 'user' ? 'white' : 'black', padding: '8px', borderRadius: '8px', maxWidth: '70%' }}>
              {message.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Message */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type Message..."
          style={{
            flex: 1,
            padding: '6px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            marginRight: '8px',
            outline: 'none',
            fontSize: '16px',
            color: '#333',
            transition: 'all 0.2s ease-in-out',
          }}
        />
        <Button onClick={handleSendMessage} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', borderRadius: '4px', transition: 'background-color 0.2s ease-in-out' }}>
          Kirim
        </Button>
      </div>
    </div>
  );
};

export default ChatAssistant;
