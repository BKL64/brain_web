export default function PrivacyPolicy() {
  return (
    <main style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      color: '#e0e0e0',
      fontFamily: 'sans-serif',
      lineHeight: '1.8'
    }}>
      <h1 style={{ color: '#00ff88', marginBottom: '8px' }}>Politique de confidentialité</h1>
      <p style={{ color: '#888', marginBottom: '32px' }}>Dernière mise à jour : mars 2026</p>

      <h2 style={{ color: '#00ccff' }}>1. Présentation</h2>
      <p>Neural Scanner est un jeu de mémoire en ligne permettant aux utilisateurs de tester leurs capacités cognitives.</p>

      <h2 style={{ color: '#00ccff' }}>2. Données collectées</h2>
      <p>Nous ne collectons aucune donnée personnelle directement. Des tiers peuvent collecter certaines informations :</p>
      <ul>
        <li><strong>Google AdSense</strong> : publicités personnalisées via cookies.</li>
        <li><strong>Vercel</strong> : hébergement, logs d&#39;accès anonymes.</li>
      </ul>

      <h2 style={{ color: '#00ccff' }}>3. Cookies et consentement</h2>
      <p>Ce site utilise une CMP certifiée Google. Un bandeau vous permet d&#39;accepter, refuser ou personnaliser les cookies lors de votre première visite.</p>

      <h2 style={{ color: '#00ccff' }}>4. Publicités</h2>
      <p>Ce site est monétisé via Google AdSense. Pour en savoir plus : <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#00ff88' }}>policies.google.com/privacy</a>.</p>

      <h2 style={{ color: '#00ccff' }}>5. Vos droits (RGPD)</h2>
      <ul>
        <li>Droit d&#39;accès à vos données</li>
        <li>Droit de rectification</li>
        <li>Droit à l&#39;effacement</li>
        <li>Droit d&#39;opposition au traitement</li>
        <li>Droit de retirer votre consentement à tout moment</li>
      </ul>

      <h2 style={{ color: '#00ccff' }}>6. Contact</h2>
      <p>Via le dépôt GitHub : <a href="https://github.com/BKL64/brain_web" target="_blank" rel="noopener noreferrer" style={{ color: '#00ff88' }}>github.com/BKL64/brain_web</a>.</p>

      <p style={{ marginTop: '40px', color: '#555', fontSize: '14px' }}>© 2026 Neural Scanner. Tous droits réservés.</p>
    </main>
  )
}
