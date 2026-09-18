from unittest.mock import MagicMock
from app.routers.chat import ask_model

def test_ask_model_returns_reply_text():
    fake_client = MagicMock()
    fake_client.chat.completions.create.return_value.choices = [
        MagicMock(message=MagicMock(content="a real-looking reply"))
    ]
    result = ask_model(fake_client, model="test-model", message="hello")
    assert result == "a real-looking reply"

def test_ask_model_propagates_a_real_client_error():
    fake_client = MagicMock()
    fake_client.chat.completions.create.side_effect = ConnectionError("local server not running")
    try:
        ask_model(fake_client, model="test-model", message="hello")
        assert False, "expected ConnectionError to propagate"
    except ConnectionError:
        pass