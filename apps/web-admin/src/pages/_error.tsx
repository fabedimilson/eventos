import React from 'react';

function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>{statusCode ? `Erro ${statusCode}` : 'Ocorreu um erro no cliente'}</h1>
      <p>IFAM Eventos — Plataforma Oficial</p>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
