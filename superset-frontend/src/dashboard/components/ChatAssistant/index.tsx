import { useState, useEffect, useRef, ReactNode } from 'react';
import Button from 'src/components/Button';
import { AsyncSelect, Steps } from 'src/components';
import { styled, t, SupersetClient, JsonResponse } from '@superset-ui/core';
import rison from 'rison';
import {
    Dataset,
    DatasetSelectLabel,
  } from 'src/features/datasets/DatasetSelectLabel';

const StyledStepTitle = styled.span`
  ${({
    theme: {
      typography: { sizes, weights },
    },
  }) => `
      font-size: ${sizes.m}px;
      font-weight: ${weights.bold};
    `}
`;

const StyledStepDescription = styled.div`
  ${({ theme: { gridUnit } }) => `
    margin-top: ${gridUnit * 4}px;
    margin-bottom: ${gridUnit * 3}px;
  `}
`;

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

//   useEffect(() => {
//     if (dataset) {
//       setMessages((prevMessages) => [
//         ...prevMessages,
//         { sender: 'bot', text: `You selected ${dataset}, How can I help you?` },
//       ]);
//     }
//   }, [dataset]);

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

  const selectedDataSource = useRef(0)

  const changeDatasource = (datasource: { label: string; value: string }) => {
    const str = datasource.value;
    const number = str.split('_')[0]; 

    selectedDataSource.current = number;
    console.log('Selected Data Source updated to:', selectedDataSource.current);
    console.log('Data Source updated:', datasource);

    const tableName = datasource.label;
    console.log('Table Name:', tableName);
    setDataset(datasource.label); 
    setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'bot', text: `You selected ${datasource.label}, How can I help you?` },
    ]);
  }

  const loadDatasources = (search: string, page: number, pageSize: number) => {
    const query = rison.encode({
      columns: [
        'id',
        'table_name',
        'datasource_type',
        'database.database_name',
        'schema',
      ],
      filters: [{ col: 'table_name', opr: 'ct', value: search }],
      page,
      page_size: pageSize,
      order_column: 'table_name',
      order_direction: 'asc',
    });
  
    // Endpoint URL
    const endpoint = `/api/v1/dataset/?q=${query}`;
  
    return SupersetClient.get({ endpoint }).then((response: JsonResponse) => {
      // Validasi respons
      const results = response.json.result;
      console.log('result', results)
      if (!Array.isArray(results)) {
        throw new Error('Invalid response format');
      }
  
      // Map data ke dalam format yang diinginkan
      const list: {
        customLabel: ReactNode;
        id: number;
        label: string;
        value: string;
      }[] = results.map((item: Dataset) => ({
        id: item.id,
        value: `${item.id}__${item.datasource_type}`,
        customLabel: DatasetSelectLabel(item),
        label: item.table_name,
      }));
  
      // Return data dengan totalCount
      return {
        data: list,
        totalCount: response.json.count,
      };
    });
  };  

  
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <Steps.Step
            description={
              <StyledStepDescription className="dataset">
                <AsyncSelect
                  autoFocus
                  ariaLabel={t('Dataset')}
                  name="select-datasource"
                  onChange={changeDatasource}
                  options={loadDatasources}
                  optionFilterProps={['id', 'label']}
                  placeholder={t('Choose a dataset')}
                  showSearch
                />
              </StyledStepDescription>
            }
          />
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
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatAssistant;
