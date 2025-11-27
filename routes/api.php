<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FileController;

Route::post('/upload', [FileController::class, 'upload']);
Route::get('/info/{id}', [FileController::class, 'info']);
Route::post('/unlock/{id}', [FileController::class, 'unlock']);
Route::get('/download/{id}', [FileController::class, 'download']);
