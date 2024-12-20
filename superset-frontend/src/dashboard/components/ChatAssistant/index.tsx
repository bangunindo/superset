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

  const selectedDataSource = useRef(0)

  const changeDatasource = (datasource: { label: string; value: string }) => {
    const str = datasource.value;
    const number = str.split('-')[0]; 

    selectedDataSource.current = number;
    console.log('Selected Data Source updated to:', selectedDataSource.current);
    console.log('Data Source updated:', datasource);

    const tableName = str.split('-')[1];
    console.log('Table Name:', tableName);
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
      console.log('result', results)
      console.log('list', list)

  
      return {
        data: list,
        totalCount: response.json.count,
      };
    });
  };  

  // const session = '.eJztVcuyqkgW_ZWOM-5zI0lIlDtTVAQFRN7Z0WHwlEeCeEARKurfK-Gc21XRdWvS0aOOHikJK_da-7H2L2-X9CNps7fvaUDa5O9vlzx--_6WROxiKaQ8ZAMWCsECCekiRAKImCXDAZ5J0DJIEjZBC47nBR6wEc-kDOQZGCzZYAlgKEAWLJaLhAVcwkVJvIwXgAUoXTCcgBAvLARuEaesMF2QIhopWbK8ECaQXaRM_EaJPNrk45MNpI9R-5FeuluZ1PSAxoPMUkjYkA8gSAQeLgOAWEogCtkQLTku4qM4iiguj_-FSgYlC6Uo13PFtEeZ0XK5leszikT5quer3CSxLed9HkBSyvmKl0VlazGNq5WCapMM4jpmfE97mN4WBCIYNFAOutscNIiPkbtjLFYxNTaWTcb5kGvwjcYjyX6V68WWVUcDaBsVaeO2lSuSxaLMq1Y0ahtj0C2bVc0-9z0HBDsBBC5D5OL20kaVYmSkWdHrKCr3WCopd5lVC5_DlY1wDhAurq-jdc7ob-cXNlJNhmibsletK6NKSulDI6fYJmLVSfct3p_7aLw9j_D1xJA8jpXSBp7_8KvdA7POI3BRGQ6oCQdhwO6uDT316VevJp5yVe0YTHnLn5guYp0ee8qIvTnGGLvyxG_0XXlUN0aPc6bELs6PljGolkr5UT0Dk-tUt2_JiOpnfaucsCDxVhM_5SzOcfjor-M8QogKbNL3RGsjIEiJq8DA3okxqwQhcU5GRaqpjhF0xgiSZ0iEMZZ2YMYUMvDHXaVv1tXRNUbd8jtNwpluAk4rYnK0skx1bYgLJ9cKmldz5gM8mGURvE4cT8n2LFk2bq2SqD5jQLV2tiYsoc069RTXd7WB1i9XJ2ytNXPO_qO4Tue7pPVYTCKqKXCdUi6ayndfI6b9EnsaiYgw3z_1T1jtuq-8MJHkDPJ2V4Yuecy52CsEV84QVU7psQ7NpfLwP_ss_8pvhiWmCec6x01cOQ8Poix07UmzFXtrEuXr9e_ffHL7E75c56FE4LHSnqGpCN82VbTxLuKjXO0jffvU30eQ9qXddB6pbJychs3Jyj7CrDVvT8PV-PWpu6nugCA8nNvjqlCGdX_eixfGlCoxR9ePxPBdI9fWh8x03C6s9HtpaLVs1e_qHm9W76TuXvHNvgaJgTw2WDRiHKZiG3H6vhVR0gprLPd8CXByz-uOqMNraZf3I9-M-b6PiYoIryBnfd6TJBulRXjO2bo-l4w8Wk9RIacwMST21KqQLzZnQYpHsEHpWbrcN2s7atLOvTmHnc2OWXJaECsz49WJi1Fcb-4WWloOHdSmxJzgSOnxVtYb2eCHmNPTy8h5o5zV25RkG-PKWgcAH2vRvACde1UDI8VQXu-lahFInn2lxkZuUUCSydZq-nQLHh018V_e_ta9ff_H_4jVKblv-YxuyYDaWoUtA1IreenWqvMtrdRFptLcXalWPqQt0auj_V-3OndQPtvZ3TXzaM_vmTqqdnQMUTadheyahBVDqMWUvnf-PJvG9dM6Ch8KTFgbuUd101HJZ2uAu1wdV0CV_A5LTuXnAKjFdjxS69Q2EbXKklXhluZry2pwi6Y74z3pJ6xRORkd42Hm4zXz2RevcR7TWiPxbKPoGVbaPOI2fI0WwMivcWPYChuR5uHYghi4_mzd2NPGwBUeHqsBqmHGqMW5UF2fmzlO9aQccbVFR-sKNWh3urR9YQvTGshQk3bkz9anEGpVnQenHFArHmSe9skQwheZ_tPcTushi90XOHrKM5Qcqn-u0cTpiSvc0hqRP-DpndR2HCGLvfMtZJUmodY88ZYJI1DMQHU8Y08pMP3Gh9Qep16o25_l59-5fNbZ-7ROujrA152_179oFlTTzJP-D3-sJ98tc88D7Y9nzFIrpD3mm38Rw40Hn-oOq-0XTuixizpMewfTNfUT3JNyeoSuA3z3nMXSDxxqcFXO-qJKaLFHtZL2q_eUODXnehQh7fWf6O2m_sW0jn_4ht7JUF67GpvMlL9n7CJwdF9NWHXj3IMVIfHA9DQeXUcvMuVoihPRbyNpXhUz18A1rthlssDtr3T10FqSFv9_HQrfZCS4z9o1DJMzcBvq4yXcabgQTM5bG24fesxQ9M_7BmXN5ZTC-2q_5llubR22WSDG3Knsbdovm6d28Hf9JTwnQD0ZT8nQbZa_3NWCP64kPYysk3IN1fXifF2S4D0Z9W2X5aGfQ4nUXvIoBOEiicjmWogOQwsGV3FM-27IHegctHMLP2136NiP96tP-ubVmwMDLlm4eCHOXzvd-l0vxaAJvOj8WnyslqNo2g1cF5vutQEph_dcFCSQ526q7gAgp4Im9s2t-EgR2l39w21Lsl1e1YJ-fHH7-vFQT1fZHgpSgPFw84dss-Wzh74c9233HlbGSUXJsHKrhjEA3Tl-fTsI18s6PySCGHfxtqcL8O2fv35twUvzcXvmcfJBd2NI8ueP7Xhpu6CbFmZrsffDRklIhJfLTVg3SAkfop2bqWdo9tuvvwGtEm3K.Z2GYbg.ovQJpNYnyjtZyvr8560auDzy2Kg'
  const session = '.eJwljktqA0EMRO_S6yykbqk_vswgtSQSYmKYsVfBd48gyyrqFe-3HHH69Vluz_PlH-X4snIrtFtXiOEUoBUbb40eczdRocpo1mGjBZhAG8PR1w5cQnNbUmJeO01bTpMWQbYgaDOXoyEaag0lbUQ5GoE68n9Nr9pwKq9eUuR1-flvgxn3dcbxfHz7TxYwG1bpuLkzMauPFc7BJgPAVqvVNFw0uftjy92TSfD9Bzb2RMM.Z2UF0g.8PYCnOS5Ja1b1ZsJ9Y0iTJ1S3F0'

  // const getCookie = (name) => {
  //   const value = `; ${document.cookie}`;
  //   const parts = value.split(`; ${name}=`);
  //   if (parts.length === 2) return parts.pop().split(';').shift();
  // };

  // const session = getCookie('session');

  const handleSendMessage = async () => {
    try {
        if (inputMessage.trim() && dataset) {
            setMessages((prevMessages) => [
                ...prevMessages,
                { sender: 'user', text: inputMessage },
            ]);
            console.log('Message sent:', inputMessage);
            setInputMessage('');

            const payload = {
                // dataset_id: parseInt(selectedDataSource.current, 10),
                dataset_id: 66,
                // dashboard_id: 0,
                bliv_dashboard_base_url: 'https://10.184.0.61',
                prompt: inputMessage,
            };
            console.log('Payload:', payload);

            const response = await fetch(
                'http://mjolnir-dev.vm.bangunindo.io:4000/api/v1/dashboard/chart',
                {
                    method: 'POST',
                    headers: {
                        'session': session,
                        'X-API-Key': 'jntergkgmxvjzosduihucgrjizpouroe',
                        'Content-Type': 'application/json',
                        'accept': 'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();
            console.log('Response data:', JSON.stringify(payload));

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
                              bliv_dashboard_base_url: {payload.bliv_dashboard_base_url}
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
            console.log('Input message is empty or dataset not selected.');
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
