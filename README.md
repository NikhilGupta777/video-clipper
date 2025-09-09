
# Amplify Gen 2 — Single-File Flask App (NO Docker, Code Unchanged)

Your original file is preserved exactly at: `lambda/src/temp trimmer(getting better).py`

This deploys your Flask single-file app to AWS **Lambda** behind **HTTP API** using the
**AWS Lambda Web Adapter** layer (zip mode). No code edits to your file.

## Deploy in Amplify Console (CI/CD)
1) Create **three Lambda Layers** (one-time):
   - **Lambda Web Adapter** (x86): set env `LWA_LAYER_ARN` to its ARN.
   - **FFmpeg** layer: set env `FFMPEG_LAYER_ARN`.
   - **Python deps**: a layer that contains site-packages for Python 3.11 with:
     ```
     Flask==3.0.3
     yt_dlp==2025.01.26
     ```
     Build example (Linux):
     ```bash
     mkdir -p layer/python
     pip install --platform manylinux2014_x86_64 --only-binary=:all: -t layer/python Flask==3.0.3 yt_dlp==2025.01.26
     (cd layer && zip -r pydeps.zip python)
     # Upload as a Lambda Layer and copy its ARN
     ```

2) Push this folder to GitHub. Open **AWS Amplify Console** → **Create new app** → connect repo/branch.

3) In Amplify → **Backend environment variables**, set:
   - `LWA_LAYER_ARN=arn:aws:lambda:<region>:753240598075:layer:LambdaAdapterLayerX86:25`
   - `FFMPEG_LAYER_ARN=<your ffmpeg layer arn>`
   - `PYDEPS_LAYER_ARN=<your python deps layer arn>`

4) Deploy. After provisioning, Amplify outputs **ApiUrl**; open it.

## Notes
- Increase Lambda memory/timeout/ephemeral storage in `amplify/backend.ts` if clips are larger.
- All routes are proxied (`/{proxy+}`) so your Flask routes work as-is.
- No Docker is used.
