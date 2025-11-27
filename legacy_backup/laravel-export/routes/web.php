<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FileController;

Route::get('/', [FileController::class, 'index']);
Route::post('/api/upload', [FileController::class, 'upload']);
Route::get('/api/info/{id}', [FileController::class, 'info']);
Route::post('/api/unlock/{id}', [FileController::class, 'unlock']);
Route::get('/api/download/{id}', [FileController::class, 'download']);
