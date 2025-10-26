import json

def lambda_handler(event, context):
    """
    Controls the sequence of authentication challenges.
    Flow: SRP/Password -> Question Challenge -> Caesar Challenge -> Success
    """
    try:
        session = event.get('request', {}).get('session', [])
        print(f"DefineAuthChallenge event: {json.dumps(event, indent=2)}")

        response = {
            'issueTokens': False,
            'failAuthentication': False
        }

        # Check if any previous challenge failed. If so, end the flow.
        if any(not s.get('challengeResult', False) for s in session):
            response['failAuthentication'] = True
        # After successful SRP (Secure Remote Password) verification, start password check.
        elif len(session) == 1 and session[0]['challengeName'] == 'SRP_A':
            response['challengeName'] = 'PASSWORD_VERIFIER'
        # After successful password check, issue the first custom challenge (Question).
        elif len(session) == 2 and session[1]['challengeName'] == 'PASSWORD_VERIFIER':
            response['challengeName'] = 'CUSTOM_CHALLENGE'
        # After successful Question challenge, issue the second custom challenge (Caesar).
        elif len(session) == 3 and session[2]['challengeName'] == 'CUSTOM_CHALLENGE':
            response['challengeName'] = 'CUSTOM_CHALLENGE'
        # After successful Caesar challenge, authentication is complete. Issue tokens.
        elif len(session) == 4 and session[3]['challengeName'] == 'CUSTOM_CHALLENGE':
            response['issueTokens'] = True
        # If the flow reaches an unexpected state, fail authentication.
        else:
            response['failAuthentication'] = True

        event['response'] = response
        print(f"DefineAuthChallenge response: {json.dumps(event['response'], indent=2)}")
        return event

    except Exception as e:
        print(f"Error in DefineAuthChallenge: {e}")
        event['response'] = {'issueTokens': False, 'failAuthentication': True}
        return event