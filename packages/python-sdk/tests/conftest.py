"""Shared fixtures and test data for lsbible tests."""

import pytest


@pytest.fixture
def sample_homepage_html():
    """Sample homepage HTML with buildId in __NEXT_DATA__."""
    return """
    <html>
        <script id="__NEXT_DATA__" type="application/json">
        {"buildId":"test-build-id-123","props":{"pageProps":{}}}
        </script>
    </html>
    """


@pytest.fixture
def sample_api_response():
    """Sample API response for John 3:16."""
    return {
        "pageProps": {
            "counter": 672,
            "q": "John 3:16",
            "searchMatchCount": 0,
            "passages": [
                {
                    "from": {"bn": 43, "cn": 3, "vn": 16},
                    "to": {"bn": 43, "cn": 3, "vn": 16},
                    "title": "John 3:16",
                    "passageHtml": """
                    <span class="verse" data-key="43-003-016">
                        <small data-verse="16"><span>16 </span></small>
                        <span class="prose">
                            <span class="red-letter">"For God so loved the world, that He gave His only Son, so that everyone who believes in Him will not perish, but have eternal life.</span>
                        </span>
                    </span>
                    """,
                }
            ],
            "start": 1761310084039,
            "duration": 1,
        },
        "__N_SSP": True,
    }


@pytest.fixture
def sample_passage_html_simple():
    """Simple passage HTML for testing parser."""
    return """
    <span class="verse" data-key="43-003-016">
        <small data-verse="16"><span>16 </span></small>
        <span class="prose">For God so loved the world</span>
    </span>
    """


@pytest.fixture
def sample_passage_html_formatted():
    """Passage HTML with various formatting."""
    return """
    <span class="verse" data-key="43-003-016">
        <small data-verse="16"><span>16 </span></small>
        <span class="prose">
            <span class="red-letter">"For God so loved the world, </span>
            <span>that He gave His <i>only</i> Son, </span>
            <span>so that everyone who believes in Him will not perish, </span>
            <span>but have <b>eternal life</b>.</span>
        </span>
    </span>
    """


@pytest.fixture
def sample_passage_html_small_caps():
    """Passage HTML with small caps (LORD/Yahweh)."""
    return """
    <p class="poetry">
        <span class="verse" data-key="19-023-001">
            <small data-verse="1"><span>1 </span></small>
            <span>The <span class="small-caps">Lord</span> is my shepherd</span>
        </span>
    </p>
    """


@pytest.fixture
def sample_multi_verse_response():
    """Sample API response for John 3:16-17."""
    return {
        "pageProps": {
            "counter": 673,
            "q": "John 3:16-17",
            "searchMatchCount": 0,
            "passages": [
                {
                    "from": {"bn": 43, "cn": 3, "vn": 16},
                    "to": {"bn": 43, "cn": 3, "vn": 17},
                    "title": "John 3:16-17",
                    "passageHtml": """
                    <span class="verse" data-key="43-003-016">
                        <small data-verse="16"><span>16 </span></small>
                        <span class="prose">For God so loved the world</span>
                    </span>
                    <span class="verse" data-key="43-003-017">
                        <small data-verse="17"><span>17 </span></small>
                        <span class="prose">For God did not send the Son</span>
                    </span>
                    """,
                }
            ],
            "start": 1761310084040,
            "duration": 2,
        },
        "__N_SSP": True,
    }
