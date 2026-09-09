"""Exercise deployment polling with mocked transport; no network or deploys."""
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[2]
PROJECTS = ['portal-auth', 'portal-b-day', 'portal-chuan-dai-h5', 'portal-console-web',
            'portal-weight-management', 'server-console']
for project in PROJECTS:
    source = (ROOT / project / '.github/workflows/deploy.yml').read_text()
    section = source.split('      - name: Wait for server-side deployment\n', 1)[1]
    section = section.split('        run: |\n', 1)[1].split('\n      - name:', 1)[0]
    script = '\n'.join(line[10:] for line in section.splitlines())
    subprocess.run(['bash', '-n'], input=script, text=True, check=True)
    for mode, expected in [('recover', 0), ('failed', 1), ('unknown', 1)]:
        # SECONDS advances without a real wait. The first query times out;
        # subsequent queries return the requested server state.
        mock = '''set -e
GITHUB_RUN_ID=1 GITHUB_RUN_ATTEMPT=2 DEPLOY_API_URL=unused
PROJECT_NAME=test DEPLOY_HTTP_TOKEN=test
sleep() { SECONDS=$((SECONDS + 1200)); }
curl() {
  if (( SECONDS < 1200 )); then return 28; fi
  case "$MODE" in
    recover) printf '{"status":"succeeded"}' ;;
    failed) printf '{"status":"failed","log_tail":"build failed"}' ;;
    unknown) return 28 ;;
  esac
}
'''
        result = subprocess.run(['bash'], input=mock + 'MODE=' + mode + '\n' + script,
                                text=True, capture_output=True)
        assert result.returncode == expected, (project, mode, result.stderr)
        if mode == 'unknown':
            assert 'UNKNOWN' in result.stdout + result.stderr
    print(project + ': syntax, recovery, server failure, bounded timeout PASS')
