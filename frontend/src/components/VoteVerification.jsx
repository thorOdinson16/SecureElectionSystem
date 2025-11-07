import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { publicAPI } from '../services/api';

export default function VoteVerification() {
  const [searchParams] = useSearchParams();
  const voteId = searchParams.get('vote');
  const hash = searchParams.get('hash');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (voteId && hash) {
      publicAPI.verifyVoteHash(voteId, hash).then(r => setResult(r.data));
    }
  }, [voteId, hash]);

  if (!voteId || !hash) return <p>Invalid link</p>;

  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <h2>Vote Receipt Verification</h2>
      {result === null && <p>Verifying...</p>}
      {result?.valid === true && <p style={{ color: 'green' }}>Valid Vote Recorded</p>}
      {result?.valid === false && <p style={{ color: 'red' }}>Invalid Hash</p>}
    </div>
  );
}