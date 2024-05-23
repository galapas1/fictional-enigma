import logo from './public/mancomm_logo.webp';
import './App.css';

import React, { useState, useEffect } from 'react';

function App() {
  useEffect(() => {
    document.title = 'eCFR Proj';
  }, []);

  const [apiKey,  setApiKey ] = useState('');
  const [pubDate, setPubDate] = useState('');
  const [title,   setTitle  ] = useState('');
  const [useS3,   setUseS3  ] = useState(false);
  const [data,    setData   ] = useState(null);

  const handleApiKeyChange = (event) => {
    setApiKey(event.target.value);
  };

  const handlePubDateChange = (event) => {
    setPubDate(event.target.value);
  };

  const handleTitleChange = (event) => {
    setTitle(event.target.value);
  };

  const handleUseS3Change = (event) => {
     setUseS3(event.target.checked);
  }

  const handleSubmit = (event) => {
    event.preventDefault();

    if(!(pubDate && title)) {
        setData("'Publication Date' and 'Title' are required");
        return;
    }

    var href = 'https://xeplvzxf0e.execute-api.us-east-1.amazonaws.com/dev/v1/ecfr';
    if (useS3) {
        href += '-s3';
    }
    href += '/' + pubDate + '/' + title;

    setData('...loading ...');

    const xhr = new XMLHttpRequest();
    xhr.open('GET', href);

    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("x-api-key", apiKey);

    xhr.onload = function() {
      if (useS3) {
          setData(xhr.response);
          return;
      }
      if(xhr.response.includes('html')) {
          setData(JSON.parse(JSON.parse(xhr.response)['body']));
      } else if (xhr.response.includes('message')) {
          setData(JSON.parse(JSON.parse(xhr.response)['body'])['message']);
      } else {
        setData(xhr.response);
      }
    };

    try {
      xhr.send();
    } catch (e) {
      setData('Whoops... something went wrong. Please try again');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />

        <div className="block">
          <label>API Key:</label>
          <input type="text" maxLength="36" size="40" value={apiKey} onChange={handleApiKeyChange} />
        </div>

        <div className="block">
          <label>Publication Date:</label>
          <input type="text" maxLength="11" size="40" value={pubDate} onChange={handlePubDateChange} />
        </div>

        <div className="block">
         <label>Title Num:</label>
         <input type="text" maxLength="10" size="40" value={title} onChange={handleTitleChange} />
        </div>
 
        < br />
        <div className="block">
         <span>Use S3 (checked) or .gov (unchecked)&nbsp;&nbsp;</span>
         <input type="checkbox" value={useS3} onChange={handleUseS3Change} />
        </div>

        < br />
        <button onClick={handleSubmit}>Submit</button>

        {data ? <textarea className="data" value={JSON.stringify(data)} /> :
          <div className="data">
            ...waiting...
          </div>
        }

        <a
          className="App-link"
          href="https://mancomm.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          mancomm.com
        </a>
      </header>
    </div>
  );
}

export default App;
