import { prisma } from '@/lib/db'

interface UnsubscribePageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const { token } = await searchParams
  let success = false
  let errorMessage = ''

  if (!token) {
    errorMessage = 'Nevazeci link za odjavu.'
  } else {
    try {
      const email = Buffer.from(token, 'base64url').toString()

      if (!email || !email.includes('@')) {
        errorMessage = 'Nevazeci token.'
      } else {
        const subscriber = await prisma.newsletterSubscriber.findUnique({
          where: { email },
        })

        if (!subscriber) {
          errorMessage = 'Email adresa nije pronadjena medju pretplatnicima.'
        } else if (!subscriber.isSubscribed) {
          success = true // Already unsubscribed, show success anyway
        } else {
          await prisma.newsletterSubscriber.update({
            where: { email },
            data: {
              isSubscribed: false,
              unsubscribedAt: new Date(),
            },
          })
          success = true
        }
      }
    } catch {
      errorMessage = 'Doslo je do greske. Pokusajte ponovo.'
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFBF4',
        fontFamily: "'Georgia', 'Times New Roman', serif",
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '32px 40px 24px',
            backgroundColor: '#7A7F6A',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}
          >
            ALTAMODA
          </h1>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            Heritage
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '40px', textAlign: 'center' }}>
          {success ? (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10003;</div>
              <h2
                style={{
                  margin: '0 0 16px',
                  fontSize: '22px',
                  color: '#7A7F6A',
                }}
              >
                Uspesno ste se odjavili
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '16px',
                  lineHeight: 1.6,
                  color: '#11120D',
                }}
              >
                Vasa email adresa je uklonjena sa nase newsletter liste.
                Necete vise primati promotivne poruke od nas.
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10007;</div>
              <h2
                style={{
                  margin: '0 0 16px',
                  fontSize: '22px',
                  color: '#7A7F6A',
                }}
              >
                Greska
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '16px',
                  lineHeight: 1.6,
                  color: '#11120D',
                }}
              >
                {errorMessage}
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '24px 40px',
            backgroundColor: '#FFFBF4',
            borderTop: '1px solid #e8e0d4',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '12px', color: '#8a8578' }}>
            &copy; {new Date().getFullYear()} Altamoda Heritage. Sva prava zadrzana.
          </p>
        </div>
      </div>
    </div>
  )
}
