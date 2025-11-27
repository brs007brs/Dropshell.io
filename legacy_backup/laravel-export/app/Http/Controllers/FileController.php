<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\File; // You'll need to create this model
use Carbon\Carbon;

class FileController extends Controller
{
    public function index(Request $request)
    {
        $fileId = $request->query('file');
        $seo = [
            'title' => 'Dropshell | Secure File Sharing',
            'description' => 'Anonymous, secure, and fast file transfer. Up to 20GB free.'
        ];

        if ($fileId) {
            $file = File::find($fileId);
            if ($file) {
                $seo['title'] = 'Download ' . $file->original_name . ' | Dropshell';
                $seo['description'] = 'Download ' . $file->original_name . ' (' . $this->formatBytes($file->size) . ') securely via Dropshell.';
            }
        }

        return view('welcome', compact('seo'));
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:20971520', // 20GB in KB
        ]);

        $file = $request->file('file');
        $fileId = (string) Str::uuid();
        $filename = $fileId . '.' . $file->getClientOriginalExtension();

        // Store file
        $file->storeAs('uploads', $filename);

        // Calculate expiration
        $hours = $request->input('expiration', 24);
        $expiresAt = Carbon::now()->addHours($hours);

        // Create record
        $fileRecord = new File();
        $fileRecord->id = $fileId;
        $fileRecord->original_name = $file->getClientOriginalName();
        $fileRecord->filename = $filename;
        $fileRecord->size = $file->getSize();
        $fileRecord->expires_at = $expiresAt;
        $fileRecord->password = $request->input('password'); // In production, Hash this!
        $fileRecord->save();

        return response()->json([
            'success' => true,
            'fileId' => $fileId,
            'downloadUrl' => url('/?file=' . $fileId)
        ]);
    }

    public function info($id)
    {
        $file = File::find($id);

        if (!$file || Carbon::now()->greaterThan($file->expires_at)) {
            if ($file) {
                Storage::delete('uploads/' . $file->filename);
                $file->delete();
            }
            return response()->json(['error' => 'File not found or expired'], 404);
        }

        if ($file->password) {
            return response()->json([
                'isProtected' => true,
                'fileId' => $file->id
            ]);
        }

        return response()->json([
            'isProtected' => false,
            'originalName' => $file->original_name,
            'size' => $file->size,
            'expiresAt' => $file->expires_at
        ]);
    }

    public function unlock(Request $request, $id)
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
            'downloadToken' => $file->password // Simple token
        ]);
    }

    public function download(Request $request, $id)
    {
        $file = File::find($id);

        if (!$file || Carbon::now()->greaterThan($file->expires_at)) {
            return response('File expired', 404);
        }

        if ($file->password && $file->password !== $request->query('token')) {
            return response('Access Denied', 403);
        }

        return Storage::download('uploads/' . $file->filename, $file->original_name);
    }
}
