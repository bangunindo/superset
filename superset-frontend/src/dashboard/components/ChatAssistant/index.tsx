import React, { useState, useEffect, useRef, ReactNode } from 'react';
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

interface ChatAssistantProps {
  dashboardId: number | null;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ dashboardId }) => {
  const [dataset, setDataset] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    if (dashboardId) {
    }
  }, [dashboardId]);

  useEffect(() => {
    setMessages([
      { sender: 'bot', text: 'Please select a dataset first.' }, 
      ...messages,
    ]);
  }, []);

  const selectedDataSource = useRef(0)

  const changeDatasource = (datasource: { label: string; value: string }) => {
    const str = datasource.value;
    const number = str.split('-')[0]; 

    selectedDataSource.current = number;

    const tableName = str.split('-')[1];
    setDataset(tableName); 
    setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'bot', text: `You selected ${tableName}, How can I assist you?` },
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
  
    const endpoint = `/api/v1/dataset/?q=${query}`;
  
    return SupersetClient.get({ endpoint }).then((response: JsonResponse) => {
      const results = response.json.result;
      if (!Array.isArray(results)) {
        throw new Error('Invalid response format');
      }
  
      const list: {
        customLabel: ReactNode;
        id: number;
        label: string;
        value: string;
      }[] = results.map((item: Dataset) => ({
        id: item.id,
        value: `${item.id}-${item.table_name}`,
        customLabel: DatasetSelectLabel(item),
        label: item.table_name,
      }));
  
      return {
        data: list,
        totalCount: response.json.count,
      };
    });
  };  

  //cek api key dari env
  const apiKey = process.env.REACT_APP_API_KEY || "No API Key";
  const session = process.env.SESSION_API;
  console.log('api key', apiKey)
  console.log('session', session)

  const handleSendMessage = async () => {
    try {
        if (inputMessage.trim() && dataset && dashboardId !== null) {
            setMessages((prevMessages) => [
                ...prevMessages,
                { sender: 'user', text: inputMessage },
            ]);
            setInputMessage('');

            const payload = {
                dataset_id: parseInt(selectedDataSource.current, 10),
                // dataset_id: 66,
                dashboard_id: dashboardId,
                bliv_dashboard_base_url: 'https://10.184.0.61',
                prompt: inputMessage,
            };

            const response = await fetch(
                'http://mjolnir-dev.vm.bangunindo.io:4000/api/v1/dashboard/chart',
                {
                    method: 'POST',
                    headers: {
                        'session': session,
                        'X-API-Key': apiKey,
                        'Content-Type': 'application/json',
                        'accept': 'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (data.status === 'success') {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    {
                        sender: 'bot',
                        text: (
                            <>
                              <b>Chart created successfully!</b><br />
                              Chart ID: {data.data.chart_id}<br />
                              URL: {data.data.url}<br />
                              Bliv Dashboard URL: {payload.bliv_dashboard_base_url}
                            </>
                        )
                    },
                ]);
            } else {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: 'bot', text: 'Failed to create chart. Your dataset is insufficient to build the chart. Please try again later.' },
                ]);
                console.error('API response error:', data);
            }
        } else {
        }
    } catch (error) {
        console.error('Error in handleSendMessage:', error);
        setMessages((prevMessages) => [
            ...prevMessages,
            {
                sender: 'bot',
                text: 'An error occurred. Please check the console for details.',
            },
        ]);
    }
  };

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', marginTop: '-5px' }}>
        <Steps.Step
            title={<StyledStepTitle>{t('Chat Assistant')}</StyledStepTitle>}
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
            <div style={{ display: 'inline-block', backgroundColor: message.sender === 'user' ? '#007bff' : '#e9ecef', color: message.sender === 'user' ? 'white' : 'black', padding: '8px', borderRadius: '8px', maxWidth: 'auto' }}>
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
            fontSize: '14px',
            color: '#333',
            transition: 'all 0.2s ease-in-out',
          }}
        />
        <Button onClick={handleSendMessage} disabled={!dataset} style={{ padding: '8px 16px', backgroundColor: !dataset ? '#6c757d' : '#007bff', color: 'white', borderRadius: '4px', transition: 'background-color 0.2s ease-in-out' }}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatAssistant;
