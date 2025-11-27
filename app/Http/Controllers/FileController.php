<?php

namespace App\Http\Controllers;

use App\Models\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;

class FileController extends Controller
{
    public function index(Request $request)
    {
        $fileId = $request->query('file');
        $seo = [
            'title' => 'Dropshell | Secure File Sharing',
            'description' => 'Anonymous, secure, and fast file transfer. Up to 20GB free.',
            'og_title' => 'Dropshell | Secure File Sharing',
            'og_description' => 'Anonymous, secure, and fast file transfer. Up to 20GB free.',
        ];

        if ($fileId) {
            $file = File::find($fileId);
            if ($file && now() <= $file->expires_at) {
                $size = $this->formatBytes($file->size);
                $seo['title'] = "Download {$file->original_name} | Dropshell";
                $seo['description'] = "Download {$file->original_name} ({$size}) securely via Dropshell.";
                $seo['og_title'] = "Download {$file->original_name} | Dropshell";
                $seo['og_description'] = "Securely transfer files with Dropshell. No login required.";
            }
        }

        return view('index', compact('seo'));
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:20971520', // 20GB limit (in KB) - standard PHP limit might block this though
            'expiration' => 'required|integer',
        ]);

        $file = $request->file('file');
        $path = $file->store('uploads');

        $expirationHours = (int) $request->input('expiration', 24);
        $expiresAt = now()->addHours($expirationHours);

        $password = $request->input('password');
        // Ensure empty passwords are stored as null, not empty strings
        if (empty($password)) {
            $password = null;
        }

        $fileRecord = File::create([
            'original_name' => $file->getClientOriginalName(),
            'storage_path' => $path,
            'size' => $file->getSize(),
            'password' => $password,
            'expires_at' => $expiresAt,
        ]);

        return response()->json([
            'success' => true,
            'fileId' => $fileRecord->id,
            'downloadUrl' => url("/?file={$fileRecord->id}"),
        ]);
    }

    public function info($id)
    {
        $file = File::find($id);

        if (!$file) {
            return response()->json(['error' => 'File not found or expired'], 404);
        }

        if (now() > $file->expires_at) {
            Storage::delete($file->storage_path);
            $file->delete();
            return response()->json(['error' => 'File expired'], 404);
        }

        if ($file->password) {
            return response()->json([
                'isProtected' => true,
                'fileId' => $file->id,
            ]);
        }

        return response()->json([
            'isProtected' => false,
            'originalName' => $file->original_name,
            'size' => $file->size,
            'expiresAt' => $file->expires_at,
        ]);
    }

    public function unlock($id, Request $request)
    {
        $file = File::find($id);

        if (!$file) {
            return response()->json(['error' => 'File not found'], 404);
        }

        if ($file->password && $file->password !== $request->input('password')) {
            return response()->json(['error' => 'Incorrect password'], 401);
        }

        return response()->json([
            'success' => true,
            'originalName' => $file->original_name,
            'size' => $file->size,
            'expiresAt' => $file->expires_at,
            'downloadToken' => $file->password, // Using password as token for simplicity as per legacy
        ]);
    }

    public function download($id, Request $request)
    {
        $file = File::find($id);

        if (!$file) {
            return response()->json(['error' => 'File not found'], 404);
        }

        if (now() > $file->expires_at) {
            Storage::delete($file->storage_path);
            $file->delete();
            return response()->json(['error' => 'File expired'], 404);
        }

        if ($file->password && $file->password !== $request->query('token')) {
            return response()->json(['error' => 'Access Denied'], 403);
        }

        return Storage::download($file->storage_path, $file->original_name);
    }

    private function formatBytes($bytes, $precision = 2)
    {
        if ($bytes === 0)
            return '0 Bytes';
        $k = 1024;
        $sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        $i = floor(log($bytes) / log($k));
        return round($bytes / pow($k, $i), $precision) . ' ' . $sizes[$i];
    }
}
