# VerifyAuthChallengeResponse Lambda
# Validates user responses to Question-Answer or Caesar Cipher challenges

import json
import hashlib

def caesar_decrypt(ciphertext, shift):
    decrypted = ''
    for char in ciphertext:
        if char.isalpha():
            ascii_offset = 65 if char.isupper() else 97
            decrypted += chr((ord(char) - ascii_offset - shift) % 26 + ascii_offset)
        else:
            decrypted += char
    return decrypted

def lambda_handler(event, context):
    print(event)
    response_answer = event['request']['challengeAnswer']
    private_params = event['request']['privateChallengeParameters']

    if "answerHash" in private_params:
        expected_hash = private_params['answerHash']
        provided_hash = hashlib.sha256(response_answer.encode()).hexdigest()
        event['response']['answerCorrect'] = expected_hash == provided_hash
    else:
        print("private params", private_params)
        expected_shift = int(private_params['shift'])
        provided_answer = response_answer
        clue = private_params['clue']
        expected_answer = caesar_decrypt(clue, expected_shift)
        event['response']['answerCorrect'] = expected_answer == provided_answer

    return event