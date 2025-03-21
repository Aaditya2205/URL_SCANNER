import idna
import unicodedata
import sys
import math
import subprocess


# The code will now use local files in the same directory as the script.
DICTIONARY_FILE = r"C:\Users\adity\Downloads\dictionary.txt"
KEYWORDS_FILE = r"C:\Users\adity\Downloads\keywords.txt"
PUNYCODE_DOMAINS_FILE = r"C:\Users\adity\Downloads\punycode_domains.txt"


def build_monitored_keywords():
    try:
        with open(KEYWORDS_FILE, 'r') as keywords_file:
            return keywords_file.read().strip().split('\n')
    except FileNotFoundError:
        print(f'[!] Error - {KEYWORDS_FILE} not found')
        sys.exit(1)
    except Exception as e:
        print(f'[!] Error - {e}')
        sys.exit(1)


def check_similar_characters(punycode_domain, similar_chars):
    try:
        punycode_domain = punycode_domain.strip()  # Remove any leading or trailing spaces
        unicode_domain = idna.decode(punycode_domain.encode('ascii'))
        similar_string = ''
        unicode_domain = unicode_domain.split('.')[0]

        for char in unicode_domain:
            found_similar = False
            for latin_char, similar_unicode_chars in similar_chars.items():
                if char in similar_unicode_chars:
                    similar_string += latin_char
                    found_similar = True
                    break
            if not found_similar:
                similar_string += char

        return [unicode_domain, similar_string]
    except Exception as e:
        print(f"[!] Error decoding Punycode domain {punycode_domain}: {e}")
        return [punycode_domain, '']


def hex_to_unicode(hex_string):
    try:
        unicode_code_point = int(hex_string, 16)
        unicode_character = chr(unicode_code_point)
        return unicode_character
    except:
        return ''


def build_dictionary():
    similar_chars_dict = {}
    lines = []
    try:
        with open(DICTIONARY_FILE, 'r') as dictionary_file:
            lines = dictionary_file.read().strip().split('\n')
    except FileNotFoundError:
        print(f'[!] Error - {DICTIONARY_FILE} not found')
        sys.exit(1)
    except Exception as e:
        print(f'[!] Error - {e}')
        sys.exit(1)

    for line in lines:
        if len(line) == 1:
            similar_chars_dict[line] = [line]
        else:
            temp = line.split('|')
            key = temp.pop(0)
            unicode_chars = [hex_to_unicode(char) for char in temp]
            unicode_chars.insert(0, key)
            unicode_chars = list(set(unicode_chars))
            similar_chars_dict[key] = unicode_chars

    return similar_chars_dict


def get_original_url(short_url):
    try:
        if "://" in short_url:
            scheme, netloc = short_url.split("://")
        else:
            scheme = "http"
            netloc = short_url
        
        domain = netloc.split("/")[0]
        path = netloc[len(domain):]
        
        punycode_domain = idna.encode(domain).decode('utf-8')
        punycode_url = f"{scheme}://{punycode_domain}{path}"
        
        result = subprocess.run(
            ["curl", "-Ls", "-o", "/dev/null", "-w", "%{url_effective}", punycode_url],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        if result.returncode == 0:
            original_url = result.stdout.strip()
            return original_url
        else:
            print(f"Error: {result.stderr}")
            return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None


def main():
    # 1. Implementing IDN Homograph Detection
    similar_chars_dict = build_dictionary()
    keywords_to_monitor = build_monitored_keywords()

    try:
        with open(PUNYCODE_DOMAINS_FILE, 'r') as file:
            punycode_domains = file.read().strip().split('\n')
    except FileNotFoundError:
        print(f'[!] Error - {PUNYCODE_DOMAINS_FILE} not found')
        sys.exit(1)
    except Exception as e:
        print(f'[!] Error - {e}')
        sys.exit(1)

    for domain in punycode_domains:
        result = check_similar_characters(domain, similar_chars_dict)
        keyword = result[1]

        if keyword in keywords_to_monitor:
            print(f"[!] Detected Potential Homograph Attack: {domain} -> {result[0]} with keyword {keyword}")

    # 2. Implementing URL Unshortening
    short_url = input("Enter the shortened URL: ")
    original_url = get_original_url(short_url)
    if original_url:
        print(f"Original URL: {original_url}")
    else:
        print("Failed to retrieve the original URL.")


if __name__ == '__main__':
    main()
