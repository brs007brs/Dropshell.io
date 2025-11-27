<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class File extends Model
{
    use HasUuids;

    protected $fillable = [
        'original_name',
        'storage_path',
        'size',
        'password',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];
}
